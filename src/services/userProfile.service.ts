import { createGenshinAccount, getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { getWishesByUid } from '../db/models/wishes';
import { getAchievementsByUid } from '../db/models/achievements';
import { getCharactersByUid } from '../db/models/character';
import { getWeaponsByUid } from '../db/models/weapons';
import { Achievement, Character, GenshinAccount, Weapon, Wish } from '@prisma/client';
import { UserProfile } from '../types/frontend/dvalinFile';
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

export class UserProfileService {
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
		userProfile: UserProfile & { userId: string },
		isPaimon: boolean,
		bkTree: BKTree,
		dataIndex: Index
	): Promise<Result<string, Error>> {
		if (!userProfile || !userProfile.user?.uid) {
			return err(new Error('User profile is missing UID'));
		}

		const uid = userProfile.user.uid.toString();

		const wishResult = await handleWishes(userProfile, uid, isPaimon, bkTree, dataIndex);
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
		console.log('Creating account with', userInfo);
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
