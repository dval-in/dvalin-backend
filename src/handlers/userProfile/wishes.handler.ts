import { Wish } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getWishesByUid, createMultipleWishes } from '../../db/models/wishes';
import { BKTree } from '../BKTree';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { PaimonWish } from '../../types/frontend/wish';
import { Index } from '../../types/models/dataIndex';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';

export const handleWishes = async (
	userProfile: UserProfile & { userId: string },
	uid: string,
	isPaimon: boolean,
	bktree: BKTree,
	dataIndex: Index
) => {
	if (!userProfile.wishes) return;

	const allWishes = [
		...(userProfile.wishes.CharacterEvent || []),
		...(userProfile.wishes.WeaponEvent || []),
		...(userProfile.wishes.Standard || []),
		...(userProfile.wishes.Beginner || []),
		...(userProfile.wishes.Chronicled || [])
	];

	const newlyFormatedWishes = isPaimon
		? formatPaimonWishes(allWishes, uid, bktree, dataIndex)
		: formatRegularWishes(allWishes, uid);

	const currentWishes = await getWishesByUid(uid);
	if (!currentWishes || currentWishes.length === 0) {
		if (isPaimon) {
			throw new Error('Paimon import requires initial import on Dvalin website');
		}
		// make sure dvalin user has an existing uid
		const account = await getGenshinAccountByUid(uid);
		if (!account) {
			throw new Error('User does not have a Genshin account');
		}
		await createMultipleWishes(newlyFormatedWishes);
	} else {
		const newWishes = filterNewWishes(newlyFormatedWishes, currentWishes, isPaimon);
		if (newWishes.length > 0) {
			await createMultipleWishes(newWishes);
		}
	}
};

const isPaimonWish = (wish: any): wish is PaimonWish => {
	return (wish as PaimonWish).type !== undefined && (wish as PaimonWish).code !== undefined;
};

const formatPaimonWishes = (
	wishes: any[],
	uid: string,
	bktree: BKTree,
	dataIndex: Index
): Omit<Wish, 'createdAt'>[] => {
	return wishes.filter(isPaimonWish).map((wish) => ({
		id: randomUUID(),
		uid,
		name: bktree.search(wish.id)[0].word,
		itemType: wish.type,
		time: new Date(wish.time),
		gachaType: wish.code,
		pity: wish.pity.toString(),
		wasImported: true,
		rankType: wish.rate ? '3' : getRarity(bktree.search(wish.id)[0].word, wish.type, dataIndex)
	}));
};

const getRarity = (key: string, type: 'Character' | 'Weapon', dataIndex: Index): string => {
	switch (type) {
		case 'Character':
			return dataIndex.Character[key].rarity.toString();
		default:
			return dataIndex.Weapon[key].rarity.toString();
	}
};

const formatRegularWishes = (wishes: any[], uid: string): Omit<Wish, 'createdAt'>[] => {
	return wishes.map((wish) => ({
		id: wish.number.toString() || randomUUID(),
		uid,
		name: wish.key,
		itemType: wish.type,
		time: new Date(wish.date),
		gachaType: wish.banner,
		pity: wish.pity.toString(),
		wasImported: true,
		rankType: wish.rarity.toString()
	}));
};

const filterNewWishes = (
	newWishes: Omit<Wish, 'createdAt'>[],
	currentWishes: Omit<Wish, 'createdAt'>[],
	isPaimon: boolean
) => {
	if (isPaimon) {
		const firstWishSave = currentWishes.reduce(
			(acc, wish) => Math.min(acc, wish.time.getTime()),
			Infinity
		);
		return newWishes.filter((wish) => wish.time.getTime() < firstWishSave);
	} else {
		return newWishes.filter((wish) => !currentWishes.some((w) => w.id === wish.id));
	}
};
