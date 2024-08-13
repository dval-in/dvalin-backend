import { err, ok, Result } from 'neverthrow';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { createMultipleWishes, deleteWishesByUid, getWishesByUid } from '../../db/models/wishes';
import { PaimonFile } from '../../types/frontend/paimonFile';
import { dataService } from '../../services/data.service.ts';
import temporaryBannerCode from '../../config/constant.ts';
import { WishKeyBanner } from '../../types/frontend/wish.ts';
import { Wish } from '../../types/models/wish.ts';

export const handlePaimonWishes = async (
	userProfile: PaimonFile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	const allWishes = assignGachaType(userProfile);
	if (allWishes.length === 0) {
		return ok(undefined);
	}

	const newlyFormattedWishes = formatWishes(allWishes, uid);
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

const assignGachaType = (
	userProfile: PaimonFile & { userId: string }
): {
	gachaType: WishKeyBanner;
	order: number;
	type: 'weapon' | 'character';
	code: string;
	id: string;
	time: string;
	pity: number;
	rate?: number;
}[] => {
	const allWishesWithType = [
		...(userProfile['wish-counter-character-event']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: pull.code,
			order: index + 1
		})),
		...(userProfile['wish-counter-weapon-event']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '302' as WishKeyBanner,
			order: index + 1
		})),
		...(userProfile['wish-counter-standard']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '200' as WishKeyBanner,
			order: index + 1
		})),
		...(userProfile['wish-counter-beginners']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '100' as WishKeyBanner,
			order: index + 1
		})),
		...(userProfile['wish-counter-chronicled']?.pulls || []).map((pull, index) => ({
			...pull,
			gachaType: '500' as WishKeyBanner,
			order: index + 1
		}))
	];
	return allWishesWithType;
};

const formatWishes = (
	wishes: {
		gachaType: WishKeyBanner;
		type: 'weapon' | 'character';
		code: string;
		id: string;
		time: string;
		pity: number;
		rate?: number;
		order: number;
	}[],
	uid: string
) => {
	return wishes.map((wish) => {
		const bktree = dataService.getBKTree();
		const name = bktree.search(wish.id.replace(/_/g, ''))[0].word;
		const banner = dataService.getBannerFromTime(wish.gachaType, new Date(wish.time).getTime());
		const isFeatured = banner?.featured.some((key) => key === name);
		const itemType = wish.type === 'character' ? 'Character' : 'Weapon';
		const rankType = getRarity(name, itemType);

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
			bannerId: banner.id,
			isFeatured,
			wonFiftyFifty: false,
			rankType
		};
	});
};

const getRarity = (key: string, type: 'Character' | 'Weapon'): string => {
	const dataIndex = dataService.getIndex();
	switch (type) {
		case 'Character':
			return dataIndex.Character[key].rarity.toString();
		case 'Weapon':
			return dataIndex.Weapon[key].rarity.toString();
		default:
			return '3';
	}
};

type WishesByBanner = {
	[gachaType: string]: [Wish[], Wish[]];
};

const mergeWishes = (currentWishes: Wish[], newWishes: Wish[]): Wish[] => {
	// group every wish by gachaType
	const wishesByBanner = groupWishesByBanner(newWishes, currentWishes);
	const mergedWishes: Wish[] = [];
	for (const [newW, currentW] of Object.values(wishesByBanner)) {
		const merged = mergeWishesForBanner(newW.toReversed(), currentW); // reverse to get the latest wish first
		mergedWishes.push(...merged);
	}
	return mergedWishes;
};

const groupWishesByBanner = (newWishes: Wish[], currWishes: Wish[]): WishesByBanner => {
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

const mergeWishesForBanner = (newWishes: Wish[], currentWishes: Wish[]) => {
	if (!newWishes) {
		return currentWishes;
	}
	if (!currentWishes) {
		return newWishes;
	}

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
	currentWishes.reverse();
	currentWishes.forEach((wish, i) => {
		wish.order = i + 1;
	});
	// Rebuild pity
	let fiveStarPity = 0;
	let fourStarPity = 0;
	let prev5StarIsFeatured = false;
	let prev4StarIsFeatured = false;
	// Iterate in order (oldest to newest)
	for (const wish of currentWishes) {
		fiveStarPity++;
		fourStarPity++;
		if (wish.rankType === '5') {
			wish.pity = fiveStarPity.toString();
			wish.wonFiftyFifty =
				temporaryBannerCode.includes(wish.gachaType) &&
				wish.isFeatured &&
				prev5StarIsFeatured;
			prev5StarIsFeatured = wish.isFeatured;
			fiveStarPity = 0;
		} else if (wish.rankType === '4') {
			wish.pity = fourStarPity.toString();
			fourStarPity = 0;
			wish.wonFiftyFifty =
				temporaryBannerCode.includes(wish.gachaType) &&
				wish.isFeatured &&
				prev4StarIsFeatured;
			prev4StarIsFeatured = wish.isFeatured;
		} else {
			wish.pity = '0';
		}
	}
	return currentWishes;
};
