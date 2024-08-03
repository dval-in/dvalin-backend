import { err, ok, Result } from 'neverthrow';
import { Index } from '../../types/models/dataIndex';
import { BKTree } from '../dataStructure/BKTree';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { createMultipleWishes, deleteWishesByUid, getWishesByUid } from '../../db/models/wishes';
import { Wish } from '@prisma/client';
import { PaimonFile } from '../../types/frontend/paimonFile';

export const handlePaimonWishes = async (
	userProfile: PaimonFile & { userId: string },
	uid: string,
	bktree: BKTree,
	dataIndex: Index
): Promise<Result<void, Error>> => {
	const allWishes = assignGachaType(userProfile);
	if (allWishes.length === 0) {
		return ok(undefined);
	}

	const newlyFormattedWishes = formatWishes(allWishes, uid, bktree, dataIndex);
	const currentWishesResult = await getWishesByUid(uid);
	if (currentWishesResult.isErr()) {
		return err(new Error('Failed to retrieve current wishes'));
	}
	const currentWishes = currentWishesResult.value;
	if (!currentWishes || currentWishes.length === 0) {
		const accountResult = await getGenshinAccountByUid(uid);
		if (accountResult.isErr()) {
			return err(new Error('User does not have a Genshin account'));
		}
		const finalWishes = newlyFormattedWishes.map((wish, index) => ({
			...wish,
			order: index + 1
		}));
		await createMultipleWishes(finalWishes);
	} else {
		const newWishes = mergeWishes(currentWishes, newlyFormattedWishes);
		await deleteWishesByUid(uid);
		if (newWishes.length > 0) {
			await createMultipleWishes(newWishes);
		}
	}

	return ok(undefined);
};

const assignGachaType = (userProfile: PaimonFile & { userId: string }) => {
	const allWishesWithType = [
		...(userProfile['wish-counter-character-event']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '301',
			order: index + 1
		})),
		...(userProfile['wish-counter-weapon-event']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '302',
			order: index + 1
		})),
		...(userProfile['wish-counter-standard']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '200',
			order: index + 1
		})),
		...(userProfile['wish-counter-beginners']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '100',
			order: index + 1
		})),
		...(userProfile['wish-counter-chronicled']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '500',
			order: index + 1
		}))
	];
	return allWishesWithType;
};

const formatWishes = (
	wishes: {
		gachaType: string;
		type: 'weapon' | 'character';
		code: string;
		id: string;
		time: string;
		pity: number;
		rate?: number;
		order: number;
	}[],
	uid: string,
	bktree: BKTree,
	dataIndex: Index
): Omit<Wish, 'createdAt'>[] => {
	return wishes.map((wish) => {
		const name = bktree.search(wish.id.replace(/_/g, ''))[0].word;
		const itemType = wish.type === 'character' ? 'Character' : 'Weapon';
		const rankType = wish.rate ? '3' : getRarity(name, itemType, dataIndex);

		return {
			uid,
			genshinWishId: null,
			name,
			itemType,
			order: wish.order,
			time: new Date(wish.time),
			gachaType: wish.gachaType,
			pity: wish.pity.toString(),
			wasImported: true,
			rankType
		};
	});
};

const getRarity = (key: string, type: 'Character' | 'Weapon', dataIndex: Index): string => {
	switch (type) {
		case 'Character':
			return dataIndex.Character[key].rarity.toString();
		case 'Weapon':
			return dataIndex.Weapon[key].rarity.toString();
		default:
			throw new Error('Invalid type');
	}
};

type WishWithoutCreatedAt = Omit<Wish, 'createdAt'>;

type WishesByBanner = {
	[gachaType: string]: [WishWithoutCreatedAt[], WishWithoutCreatedAt[]];
};

const mergeWishes = (
	currentWishes: WishWithoutCreatedAt[],
	newWishes: WishWithoutCreatedAt[]
): WishWithoutCreatedAt[] => {
	// group every wish by gachaType
	const wishesByBanner = groupWishesByBanner(newWishes, currentWishes);
	const mergedWishes: WishWithoutCreatedAt[] = [];
	for (const [newW, currentW] of Object.values(wishesByBanner)) {
		const merged = mergeWishesForBanner(newW.toReversed(), currentW); // reverse to get the latest wish first
		mergedWishes.push(...merged);
	}
	return mergedWishes;
};

const groupWishesByBanner = (
	newWishes: WishWithoutCreatedAt[],
	currWishes: WishWithoutCreatedAt[]
): WishesByBanner => {
	const result: WishesByBanner = {};
	// Helper function to ensure each gachaType has an entry
	const ensureGachaTypeEntry = (gachaType: string) => {
		if (!result[gachaType]) {
			result[gachaType] = [[], []];
		}
	};

	// Process new wishes
	for (const wish of newWishes) {
		ensureGachaTypeEntry(wish.gachaType);
		result[wish.gachaType][0].push(wish);
	}

	// Process current wishes
	for (const wish of currWishes) {
		ensureGachaTypeEntry(wish.gachaType);
		result[wish.gachaType][1].push(wish);
	}

	return result;
};

const mergeWishesForBanner = (
	newWishes: WishWithoutCreatedAt[],
	currentWishes: WishWithoutCreatedAt[]
) => {
	if (!newWishes) {
		return currentWishes;
	}
	if (!currentWishes) {
		return newWishes;
	}
	// only for now
	currentWishes.reverse();
	// rebuild order
	currentWishes.forEach((wish, i) => {
		wish.order = i + 1;
	});

	const oldestWishSaved = currentWishes.at(-1);
	let index = newWishes.findIndex((wish) => wish.time <= oldestWishSaved.time);
	let wishToAdd = [];
	if (oldestWishSaved.time > newWishes[index].time) {
		// gap between wishes
		wishToAdd = newWishes.slice(index);
		currentWishes.push(...wishToAdd);
		return currentWishes;
	}
	while (
		index < newWishes.length &&
		oldestWishSaved.time.getTime() === newWishes[index].time.getTime()
	) {
		if (
			oldestWishSaved.name === newWishes[index].name &&
			currentWishes.length > 1 &&
			currentWishes.at(-2).name === newWishes[index - 1]?.name
		) {
			// Found the exact match, break the loop
			break;
		}
		index++;
	}
	wishToAdd = newWishes.slice(index + 1);
	currentWishes.push(...wishToAdd);
	currentWishes.forEach((wish, i) => {
		wish.order = i + 1;
	});
	return currentWishes;
};
