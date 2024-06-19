import { Wish } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getWishesByUid, createMultipleWishes } from '../../db/models/wishes';
import { BKTree } from '../dataStructure/BKTree';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { IMappedWish, PaimonWish } from '../../types/frontend/wish';
import { Index } from '../../types/models/dataIndex';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { Result, ok, err } from 'neverthrow';

export const handleWishes = async (
	userProfile: UserProfile & { userId: string },
	uid: string,
	isPaimon: boolean,
	bktree: BKTree,
	dataIndex: Index
): Promise<Result<void, Error>> => {
	if (!userProfile.wishes) return ok(undefined);

	const allWishes = [
		...(userProfile.wishes.CharacterEvent || []),
		...(userProfile.wishes.WeaponEvent || []),
		...(userProfile.wishes.Standard || []),
		...(userProfile.wishes.Beginner || []),
		...(userProfile.wishes.Chronicled || [])
	];

	const newlyFormattedWishes = isPaimon
		? formatPaimonWishes(allWishes, uid, bktree, dataIndex)
		: formatRegularWishes(allWishes, uid);

	const currentWishesResult = await getWishesByUid(uid);
	if (currentWishesResult.isErr()) {
		return err(new Error('Failed to retrieve current wishes'));
	}
	const currentWishes = currentWishesResult.value;

	if (!currentWishes || currentWishes.length === 0) {
		if (isPaimon) {
			return err(new Error('Paimon import requires initial import on Dvalin website'));
		}
		const accountResult = await getGenshinAccountByUid(uid);
		if (accountResult.isErr()) {
			return err(new Error('User does not have a Genshin account'));
		}
		await createMultipleWishes(newlyFormattedWishes);
	} else {
		const newWishes = filterNewWishes(newlyFormattedWishes, currentWishes, isPaimon);
		if (newWishes.length > 0) {
			await createMultipleWishes(newWishes);
		}
	}

	return ok(undefined);
};

const isPaimonWish = (wish: unknown): wish is PaimonWish => {
	return (
		typeof wish === 'object' &&
		wish !== null &&
		'type' in wish &&
		'code' in wish &&
		wish.type !== undefined &&
		wish.code !== undefined
	);
};

const formatPaimonWishes = (
	wishes: unknown[],
	uid: string,
	bktree: BKTree,
	dataIndex: Index
): Omit<Wish, 'createdAt'>[] => {
	return wishes.filter(isPaimonWish).map((wish) => {
		const searchResult = bktree.search(wish.id)[0].word;
		return {
			id: randomUUID(),
			uid,
			name: searchResult,
			itemType: wish.type,
			time: new Date(wish.time),
			gachaType: wish.code,
			pity: wish.pity.toString(),
			wasImported: true,
			rankType: wish.rate ? '3' : getRarity(searchResult, wish.type, dataIndex)
		};
	});
};

const getRarity = (key: string, type: 'Character' | 'Weapon', dataIndex: Index): string => {
	switch (type) {
		case 'Character':
			return dataIndex.Character[key].rarity.toString();
		default:
			return dataIndex.Weapon[key].rarity.toString();
	}
};

const formatRegularWishes = (wishes: IMappedWish[], uid: string): Omit<Wish, 'createdAt'>[] => {
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

		const wishMap = new Map<string, Omit<Wish, 'createdAt'>>();
		const pq = new PriorityQueue(
			(a: Omit<Wish, 'createdAt'>, b: Omit<Wish, 'createdAt'>) =>
				a.time.getTime() - b.time.getTime()
		);

		currentWishes.forEach((wish) => {
			const key = `${wish.name}-${wish.time.getTime()}-${wish.gachaType}-${wish.pity}`;
			wishMap.set(key, wish);
			pq.enqueue(wish);
		});

		return newWishes.filter((wish) => {
			const key = `${wish.name}-${wish.time.getTime()}-${wish.gachaType}-${wish.pity}`;
			return wish.time.getTime() < firstWishSave && !wishMap.has(key);
		});
	} else {
		const wishSet = new Set<string>(
			currentWishes.map(
				(wish) => `${wish.name}-${wish.time.getTime()}-${wish.gachaType}-${wish.pity}`
			)
		);

		return newWishes.filter((wish) => {
			const key = `${wish.name}-${wish.time.getTime()}-${wish.gachaType}-${wish.pity}`;
			return !wishSet.has(key);
		});
	}
};
