import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { getWishesByUid } from '../db/models/wishes';
import { getAchievementsByUid } from '../db/models/achievements';
import { getCharactersByUid } from '../db/models/character';
import { getWeaponsByUid } from '../db/models/weapons';
import { Wish } from '@prisma/client';
import { UserProfile } from '../types/frontend/dvalinFile';
import { Index } from '../types/models/dataIndex';
import { BKTree } from '../handlers/BKTree';
import { handleCharacters } from '../handlers/userProfile/characters.handler';
import { handleWeapons } from '../handlers/userProfile/weapons.handler';
import { handleWishes } from '../handlers/userProfile/wishes.handler';
import { handleAchievements } from '../handlers/userProfile/achievements.handler';

export class UserProfileService {
	async getUserProfile(userId: string): Promise<UserProfile | {}> {
		const genshinAccounts = await getGenshinAccountsByUser(userId);
		if (!genshinAccounts?.length) return {};

		const account = genshinAccounts[0];
		const allWishes = await getWishesByUid(account.uid);

		const user = {
			server: account.server,
			ar: account.ar,
			uid: account.uid,
			wl: account.wl
		};

		const wishes = this.formatWishesByType(allWishes);
		const achievements = await getAchievementsByUid(account.uid);
		const characters = await getCharactersByUid(account.uid);
		const weapons = await getWeaponsByUid(account.uid);

		return {
			format: 'dvalin',
			version: 1,
			user,
			wishes,
			achievements,
			characters,
			weapons
		};
	}

	async syncUserProfile(
		userProfile: UserProfile & { userId: string },
		isPaimon: boolean,
		bkTree: BKTree,
		dataIndex: Index
	) {
		if (!userProfile || !userProfile.user?.uid) {
			throw new Error('User profile is missing UID');
		}

		const uid = userProfile.user.uid.toString();
		await handleWishes(userProfile, uid, isPaimon, bkTree, dataIndex);
		await handleAchievements(userProfile, uid);
		await handleCharacters(userProfile, uid);
		await handleWeapons(userProfile, uid);

		return userProfile.userId;
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
