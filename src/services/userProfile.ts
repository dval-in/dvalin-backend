import { getGenshinAccountsByUser } from '../db/genshinAccount';
import { getWishesByUid } from '../db/wishes';
import { getAchievementsByUid } from '../db/achievements';
import { getCharactersByUid } from '../db/character';
import { getWeaponsByUid } from '../db/weapons';
import { Wish } from '@prisma/client';

export const getUserProfile = async (userId: string) => {
	const genshinAccount = await getGenshinAccountsByUser(userId);
	if (!genshinAccount?.length) return {};

	const account = genshinAccount[0];
	const allWishes = await getWishesByUid(account.uid);

	const user = {
		server: account.server,
		ar: account.ar,
		uid: account.uid,
		wl: account.wl
	};

	const wishes = formatWishesByType(allWishes);
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
};

const formatWishesByType = (allWishes: Wish[] | undefined) => {
	if (!allWishes) return {};

	const filterAndConvert = (type: string) =>
		convertToFrontendWishes(allWishes.filter((w) => w.gachaType === type));

	return {
		WeaponEvent: filterAndConvert('302'),
		Standard: filterAndConvert('200'),
		CharacterEvent: filterAndConvert('301').concat(filterAndConvert('400')),
		Beginner: filterAndConvert('100'),
		Chronicled: filterAndConvert('500')
	};
};

const convertToFrontendWishes = (wishes: Wish[]) => {
	return wishes.map((wish) => ({
		type: wish.itemType,
		number: wish.id,
		key: wish.name,
		date: wish.time,
		pity: wish.pity,
		rarity: wish.rankType,
		banner: 'BalladInGoblets1'
	}));
};
