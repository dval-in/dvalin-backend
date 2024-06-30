import { createGenshinAccount, getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { getWishesByUid } from '../db/models/wishes';
import { getAchievementsByUid } from '../db/models/achievements';
import { getCharactersByUid, saveCharacters } from '../db/models/character';
import { deleteWeaponsByUid, getWeaponsByUid, saveWeapons } from '../db/models/weapons';
import { Achievement, Character, GenshinAccount, Weapon, Wish } from '@prisma/client';
import { isDvalinUserProfile, UserProfile } from '../types/frontend/dvalinFile';
import { Index } from '../types/models/dataIndex';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { handleCharacters } from '../handlers/userProfile/characters.handler';
import { handleWeapons } from '../handlers/userProfile/weapons.handler';
import { handleWishes } from '../handlers/userProfile/wishes.handler';
import { handleAchievements } from '../handlers/userProfile/achievements.handler';
import { Result, ok, err } from 'neverthrow';
import { mapCardName, queryUserInfoEnka } from '../utils/enka';
import { getServer } from '../utils/hoyolab';
import { isLangKey } from '../types/frontend/config';
import { Config } from '@prisma/client';
import { getConfigFromUid, updateConfig } from '../db/models/config';
import { getAuthsByUser } from '../db/models/auth';
import { deleteUserById } from '../db/models/user';
import { isPaimonData, PaimonFile } from '../types/frontend/paimonFIle';
import { handlePaimonWishes } from '../handlers/userProfile/paimonWishes.handler';
import { handlePaimonAchievements } from '../handlers/userProfile/paimonAchievements.handler';
import { transformCharacterFromWishes } from '../handlers/wish/characters.handler';
import { transformWeaponFromWishes } from '../handlers/wish/weapons.handler';

export class UserProfileService {
	async deleteUserProfile(userId: string): Promise<Result<void, Error>> {
		const result = await deleteUserById(userId);

		return result;
	}
	async getUserProfile(userId: string): Promise<Result<UserProfile | {}, Error>> {
		const genshinAccountsResult = await getGenshinAccountsByUser(userId);
		if (genshinAccountsResult.isErr()) {
			return err(genshinAccountsResult.error);
		}
		const authResult = await getAuthsByUser(userId);
		if (authResult.isErr()) {
			return err(authResult.error);
		}

		const auth = authResult.value.map((a) => a.provider);

		const genshinAccounts = genshinAccountsResult.value;
		if (!genshinAccounts?.length) return ok({});
		const account = genshinAccounts[0];
		const allWishesResult = await getWishesByUid(account.uid);
		let allWishes: Wish[] = [];
		if (!allWishesResult.isErr()) {
			allWishes = allWishesResult.value;
		}

		const config = await getConfigFromUid(account.uid);
		if (config.isErr()) {
			return err(config.error);
		}

		const wishes = this.formatWishesByType(allWishes);
		const achievementsResult = await getAchievementsByUid(account.uid);
		let achievements: Achievement[] = [];
		if (!achievementsResult.isErr()) {
			achievements = achievementsResult.value;
		}
		const charactersResult = await getCharactersByUid(account.uid);
		let charactersArray: Character[] = [];
		if (!charactersResult.isErr()) {
			charactersArray = charactersResult.value;
		}
		const characters = charactersArray.reduce<Record<string, Omit<Character, 'key'>>>(
			(acc, c) => {
				const { key, ...otherProps } = c;
				acc[key] = otherProps;
				return acc;
			},
			{}
		);

		const weaponsResult = await getWeaponsByUid(account.uid);
		let weapons: Weapon[] = [];
		if (!weaponsResult.isErr()) {
			weapons = weaponsResult.value;
		}

		return ok({
			format: 'dvalin',
			version: 1,
			account,
			wishes,
			auth,
			config: config.value,
			achievements: achievements,
			characters: characters,
			weapons: weapons
		});
	}

	async syncUserProfile(
		userProfile: (UserProfile | PaimonFile) & { userId: string },
		bkTree: BKTree,
		dataIndex: Index
	): Promise<Result<string, Error>> {
		if (userProfile.format === 'paimon' && isPaimonData(userProfile)) {
			const uid = userProfile['wish-uid']?.toString();
			if (!uid) {
				return err(new Error('User not found'));
			}

			const wishResult = await handlePaimonWishes(userProfile, uid, bkTree, dataIndex);
			if (wishResult.isErr()) {
				return err(new Error('Failed to handle wishes'));
			}

			const achievementResult = await handlePaimonAchievements(userProfile, uid);
			if (achievementResult.isErr()) {
				return err(new Error('Failed to handle achievements'));
			}

			const configResult = await getConfigFromUid(uid);
			if (configResult.isErr()) {
				return err(new Error('Failed to fetch config'));
			}
			const config = configResult.value;

			const wishes = await getWishesByUid(uid);
			if (wishes.isErr()) {
				return err(new Error('Failed to fetch wishes'));
			}
			const charWishes = wishes.value.filter((wish) => wish.itemType === 'Character');
			const weaponWishes = wishes.value.filter((wish) => wish.itemType === 'Weapon');
			const transformedCharacters = transformCharacterFromWishes(charWishes, uid);
			const transformedWeapons = transformWeaponFromWishes(
				[],
				weaponWishes,
				config.autoRefine3,
				config.autoRefine4,
				config.autoRefine5
			);
			const saveChar = await saveCharacters(transformedCharacters);
			if (saveChar.isErr()) {
				return err(new Error('Failed to save characters'));
			}
			const deleteWeapons = await deleteWeaponsByUid(uid);
			if (deleteWeapons.isErr()) {
				return err(new Error('Failed to delete weapons'));
			}
			const saveWeapon = await saveWeapons(transformedWeapons);
			if (saveWeapon.isErr()) {
				return err(new Error('Failed to save weapons'));
			}
			return ok(userProfile.userId);
		}
		if (userProfile.format === 'dvalin' && isDvalinUserProfile(userProfile)) {
			if (!userProfile.account) {
				return err(new Error('User not found'));
			}
			const uid = userProfile.account.uid.toString();

			const wishResult = await handleWishes(userProfile, uid);
			if (wishResult.isErr()) {
				return err(new Error('Failed to handle wishes'));
			}

			const achievementResult = await handleAchievements(userProfile, uid);
			if (achievementResult.isErr()) {
				return err(new Error('Failed to handle achievements'));
			}

			const characterResult = await handleCharacters(userProfile, uid);
			if (characterResult.isErr()) {
				return err(new Error('Failed to handle characters'));
			}

			const weaponResult = await handleWeapons(userProfile, uid);
			if (weaponResult.isErr()) {
				return err(new Error('Failed to handle weapons'));
			}
			return ok(userProfile.userId);
		}
		return err(new Error('Invalid user profile format'));
	}

	async createNewUser(
		uid: string,
		config: Config,
		userId: string
	): Promise<Result<GenshinAccount, Error>> {
		const result = await queryUserInfoEnka(uid);
		if (result.isErr()) {
			return err(result.error);
		}

		if (!isLangKey(config.preferedLanguage)) {
			config.preferedLanguage = 'en';
		}

		const userInfo = {
			server: getServer(uid),
			ar: result.value.playerInfo.level,
			uid: uid,
			wl: result.value.playerInfo.worldLevel,
			name: result.value.playerInfo.nickname,
			namecard: mapCardName(result.value.playerInfo.nameCardId),
			signature: result.value.playerInfo.signature
		};
		const createAccountResult = await createGenshinAccount({ userId, ...userInfo }, config);

		return createAccountResult;
	}

	async updateConfig(userId: string, config: Config): Promise<Result<Config, Error>> {
		const uidresult = await getGenshinAccountsByUser(userId);
		if (uidresult.isErr()) {
			return err(uidresult.error);
		}
		const result = await getConfigFromUid(uidresult.value[0].uid);
		if (result.isErr()) {
			return err(result.error);
		}

		const currentConfig = result.value;
		if (!currentConfig) {
			return err(new Error('Config not found'));
		}

		const updatedConfig: Config = {
			...currentConfig,
			...config
		};
		const resultUpdate = await updateConfig(updatedConfig);
		return resultUpdate;
	}

	private formatWishesByType(allWishes: Wish[] | undefined) {
		if (!allWishes) return {};

		const filterAndConvert = (type: string) =>
			this.convertToFrontendWishes(allWishes.filter((w) => w.gachaType === type));

		return {
			WeaponEvent: filterAndConvert('302'),
			Standard: filterAndConvert('200'),
			CharacterEvent: filterAndConvert('301').concat(filterAndConvert('400')),
			Beginner: filterAndConvert('100'),
			Chronicled: filterAndConvert('500')
		};
	}

	private convertToFrontendWishes(wishes: Wish[]) {
		return wishes.map((wish) => ({
			type: wish.itemType,
			number: wish.id,
			key: wish.name,
			date: wish.time,
			pity: wish.pity,
			rarity: wish.rankType,
			banner: 'BalladInGoblets1'
		}));
	}
}
