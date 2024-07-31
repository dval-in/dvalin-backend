import { err, ok, Result } from 'neverthrow';
import { Index } from '../../types/models/dataIndex';
import { BKTree } from '../dataStructure/BKTree';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { createMultipleWishes, getWishesByUid } from '../../db/models/wishes';
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
): Omit<Wish, 'createdAt' | 'order'>[] => {
	return wishes.map((wish) => {
		const name = bktree.search(wish.id.replace(/_/g, ''))[0].word;
		const itemType = wish.type === 'character' ? 'Character' : 'Weapon';
		const rankType = wish.rate ? '3' : getRarity(name, itemType, dataIndex);

		return {
			uid,
			genshinWishId: null,
			name,
			itemType,
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

function mergeWishes(
	currentWishes: Omit<Wish, 'createdAt'>[],
	newWishes: Omit<Wish, 'createdAt' | 'order'>[]
): Omit<Wish, 'createdAt'>[] {
	const mergedWishes: Omit<Wish, 'createdAt'>[] = [];
	let currentIndex = 0;
	let newIndex = 0;

	while (currentIndex < currentWishes.length || newIndex < newWishes.length) {
		if (newIndex >= newWishes.length) {
			// If we've exhausted new wishes, add remaining current wishes
			mergedWishes.push(currentWishes[currentIndex]);
			currentIndex++;
		} else if (currentIndex >= currentWishes.length) {
			// If we've exhausted current wishes, add remaining new wishes
			mergedWishes.push({
				...newWishes[newIndex],
				order: mergedWishes.length + 1,
				genshinWishId: null
			});
			newIndex++;
		} else {
			// Compare timestamps
			const currentTime = currentWishes[currentIndex].time.getTime();
			const newTime = newWishes[newIndex].time.getTime();

			if (newTime <= currentTime) {
				// Add new wish
				mergedWishes.push({
					...newWishes[newIndex],
					order: mergedWishes.length + 1,
					genshinWishId: null
				});
				newIndex++;
			} else {
				// Add current wish
				mergedWishes.push({
					...currentWishes[currentIndex],
					order: mergedWishes.length + 1
				});
				currentIndex++;
			}
		}
	}

	return mergedWishes;
}
