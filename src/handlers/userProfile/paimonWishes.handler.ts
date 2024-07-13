import { err, ok, Result } from 'neverthrow';
import { Index } from '../../types/models/dataIndex';
import { BKTree } from '../dataStructure/BKTree';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { createMultipleWishes, getWishesByUid } from '../../db/models/wishes';
import { Wish } from '@prisma/client';
import { PaimonFile } from '../../types/frontend/paimonFIle';
import { randomUUID } from 'crypto';
import { getBannerIdFromTime } from 'utils/bannerIdentifier';

export const handlePaimonWishes = async (
	userProfile: PaimonFile & { userId: string },
	uid: string,
	bktree: BKTree,
	dataIndex: Index
): Promise<Result<void, Error>> => {
	const allWishes = assignGachaType(userProfile);
	if (allWishes.length === 0) return ok(undefined);

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
		return err(new Error('User needs to add wishes with dvalin first'));
	} else {
		const newWishes = filterNewWishes(newlyFormattedWishes, currentWishes);
		if (newWishes.length > 0) {
			await createMultipleWishes(newWishes);
		}
	}

	return ok(undefined);
};

const assignGachaType = (userProfile: PaimonFile & { userId: string }) => {
	const allWishesWithType = [
		...(userProfile['wish-counter-character-event']?.pulls || []).map((pull) => ({
			...pull,
			gachaType: '301'
		})),
		...(userProfile['wish-counter-weapon-event']?.pulls || []).map((pull) => ({
			...pull,
			gachaType: '302'
		})),
		...(userProfile['wish-counter-standard']?.pulls || []).map((pull) => ({
			...pull,
			gachaType: '200'
		})),
		...(userProfile['wish-counter-beginners']?.pulls || []).map((pull) => ({
			...pull,
			gachaType: '100'
		})),
		...(userProfile['wish-counter-chronicled']?.pulls || []).map((pull) => ({
			...pull,
			gachaType: '500'
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
	}[],
	uid: string,
	bktree: BKTree,
	dataIndex: Index
): Omit<Wish, 'createdAt'>[] => {
	return wishes.map((wish) => {
		const name = bktree.search(wish.id.replace(/_/g, ''))[0].word;
		return {
			id: randomUUID(),
			uid,
			name,
			itemType: wish.type === 'character' ? 'Character' : 'Weapon',
			time: new Date(wish.time),
			gachaType: wish.gachaType,
			pity: wish.pity.toString(),
			wasImported: true,
			rankType: wish.rate
				? '3'
				: getRarity(name, wish.type === 'character' ? 'Character' : 'Weapon', dataIndex),
			bannerId: getBannerIdFromTime(wish.gachaType, new Date(wish.time))
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

const filterNewWishes = (
	newWishes: Omit<Wish, 'createdAt'>[],
	currentWishes: Omit<Wish, 'createdAt'>[]
) => {
	const wishMap = new Map<string, Omit<Wish, 'createdAt'>>();
	let latestCurrentWishTime = -Infinity;

	currentWishes.forEach((wish) => {
		const key = `${wish.name}-${wish.time.getTime()}-${wish.gachaType}`;
		wishMap.set(key, wish);
		latestCurrentWishTime = Math.max(latestCurrentWishTime, wish.time.getTime());
	});

	const filteredWishes = newWishes.filter((wish) => {
		const key = `${wish.name}-${wish.time.getTime()}-${wish.gachaType}`;
		return !wishMap.has(key) && wish.time.getTime() < latestCurrentWishTime;
	});

	return filteredWishes;
};
