import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { getWishesByUid } from '../db/models/wishes';
import { getAchievementsByUid } from '../db/models/achievements';
import { getCharactersByUid } from '../db/models/character';
import { getWeaponsByUid } from '../db/models/weapons';
import { Wish } from '@prisma/client';
import { UserProfile } from '../types/frontend/dvalinFile';
import { Index } from '../types/models/dataIndex';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { handleCharacters } from '../handlers/userProfile/characters.handler';
import { handleWeapons } from '../handlers/userProfile/weapons.handler';
import { handleWishes } from '../handlers/userProfile/wishes.handler';
import { handleAchievements } from '../handlers/userProfile/achievements.handler';
import { Result, ok, err } from 'neverthrow';

export class UserProfileService {
	async getUserProfile(userId: string): Promise<Result<UserProfile | {}, Error>> {
		const genshinAccountsResult = await getGenshinAccountsByUser(userId);
		if (genshinAccountsResult.isErr()) {
			return err(genshinAccountsResult.error);
		}

		const genshinAccounts = genshinAccountsResult.value;
		if (!genshinAccounts?.length) return ok({});

		const account = genshinAccounts[0];
		const allWishesResult = await getWishesByUid(account.uid);
		if (allWishesResult.isErr()) {
			return err(allWishesResult.error);
		}

		const allWishes = allWishesResult.value;

		const user = {
			server: account.server,
			ar: account.ar,
			uid: account.uid,
			wl: account.wl
		};

		const wishes = this.formatWishesByType(allWishes);
		const achievementsResult = await getAchievementsByUid(account.uid);
		if (achievementsResult.isErr()) {
			return err(achievementsResult.error);
		}

		const charactersResult = await getCharactersByUid(account.uid);
		if (charactersResult.isErr()) {
			return err(charactersResult.error);
		}

		const weaponsResult = await getWeaponsByUid(account.uid);
		if (weaponsResult.isErr()) {
			return err(weaponsResult.error);
		}

		return ok({
			format: 'dvalin',
			version: 1,
			user,
			wishes,
			achievements: achievementsResult.value,
			characters: charactersResult.value,
			weapons: weaponsResult.value
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
