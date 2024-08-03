import { createGenshinAccount, getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { getWishesByUid } from '../db/models/wishes';
import { getAchievementsByUid } from '../db/models/achievements';
import { getCharactersByUid, saveCharacters } from '../db/models/character';
import { deleteWeaponsByUid, getWeaponsByUid, saveWeapons } from '../db/models/weapons';
import { Achievement, Character, GenshinAccount, Weapon, Wish, Config } from '@prisma/client';
import { isDvalinUserProfile, UserProfile } from '../types/frontend/dvalinFile';
import { Index } from '../types/models/dataIndex';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { handleCharacters } from '../handlers/userProfile/characters.handler.ts';
import { handleWeapons } from '../handlers/userProfile/weapons.handler.ts';
import { handleWishes } from '../handlers/userProfile/wishes.handler.ts';
import { handleAchievements } from '../handlers/userProfile/achievements.handler.ts';
import { Result, ok, err } from 'neverthrow';
import { mapCardName, queryUserInfoEnka } from '../utils/enka';
import { getServer } from '../utils/hoyolab';
import { isLangKey } from '../types/frontend/config';
import { getConfigFromUid, updateConfig } from '../db/models/config';
import { getAuthsByUser } from '../db/models/auth';
import { deleteUserById } from '../db/models/user';
import { isPaimonData, PaimonFile } from '../types/frontend/paimonFile.ts';
import { handlePaimonWishes } from '../handlers/userProfile/paimonWishes.handler.ts';
import { handlePaimonAchievements } from '../handlers/userProfile/paimonAchievements.handler.ts';
import { transformCharacterFromWishes } from '../handlers/wish/characters.handler.ts';
import { transformWeaponFromWishes } from '../handlers/wish/weapons.handler.ts';
import { IWish } from '../types/frontend/wish.ts';
import { IAchievements } from '../types/frontend/achievement.ts';
import { ICharacters } from '../types/frontend/character.ts';
import { IUser } from '../types/frontend/user.ts';

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
		if (!genshinAccounts?.length) {
			return ok({});
		}
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
		const mappedAchievements: IAchievements = achievements.reduce((acc, achievement) => {
			acc[achievement.key] = achievement.achieved;
			return acc;
		}, {} as IAchievements);
		const charactersResult = await getCharactersByUid(account.uid);
		let charactersArray: Character[] = [];
		if (!charactersResult.isErr()) {
			charactersArray = charactersResult.value;
		}
		const characters: ICharacters = charactersArray.reduce((acc, char) => {
			const {
				key,
				level,
				constellation,
				ascension,
				talentAuto,
				talentSkill,
				talentBurst,
				manualConstellations
			} = char;

			acc[key] = {
				level,
				constellation,
				ascension,
				talent: {
					auto: talentAuto,
					skill: talentSkill,
					burst: talentBurst
				},
				manualConstellations
			};

			return acc;
		}, {} as ICharacters);

		const weaponsResult = await getWeaponsByUid(account.uid);
		let weapons: Weapon[] = [];
		if (!weaponsResult.isErr()) {
			weapons = weaponsResult.value;
		}

		const user: IUser = {
			uid: Number(account.uid),
			server: account.server,
			ar: account.ar,
			wl: account.wl,
			name: account.name,
			namecard: account.namecard,
			signature: account.signature
		};

		const userProfile: UserProfile = {
			format: 'dvalin',
			version: 1,
			account: user,
			wishes,
			auth,
			config: config.value,
			achievements: mappedAchievements,
			characters: characters,
			weapons: weapons
		};
		return ok(userProfile);
	}

	async syncUserProfile(
		userProfile: (UserProfile | PaimonFile) & { userId: string },
		bkTree: BKTree,
		dataIndex: Index
	): Promise<Result<string, Error>> {
		if (userProfile.format === 'paimon' && isPaimonData(userProfile)) {
			return await this.syncPaimonUserProfile(userProfile, bkTree, dataIndex);
		}
		if (userProfile.format === 'dvalin' && isDvalinUserProfile(userProfile)) {
			return await this.syncDvalinUserProfile(userProfile);
		}
		return err(new Error('Invalid user profile format'));
	}

	async syncPaimonUserProfile(
		userProfile: PaimonFile & { userId: string },
		bkTree: BKTree,
		dataIndex: Index
	): Promise<Result<string, Error>> {
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

	async syncDvalinUserProfile(
		userProfile: UserProfile & { userId: string }
	): Promise<Result<string, Error>> {
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

	private formatWishesByType(allWishes: Wish[] | undefined): Record<string, IWish[]> {
		if (!allWishes) {
			return {};
		}

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

	private convertToFrontendWishes(wishes: Wish[]): IWish[] {
		return wishes.map((wish) => ({
			type: wish.itemType === 'Character' ? 'Character' : 'Weapon',
			number: Number(wish.genshinWishId),
			key: wish.name,
			date: wish.time,
			pity: Number(wish.pity),
			rarity: Number(wish.rankType),
			banner: 'BalladInGoblets1',
			order: wish.order
		}));
	}
}
