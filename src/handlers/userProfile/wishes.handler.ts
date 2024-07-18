import { Wish } from '@prisma/client';
import { getWishesByUid, createMultipleWishes } from '../../db/models/wishes';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { IMappedWish, IWish } from '../../types/frontend/wish';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { Result, ok, err } from 'neverthrow';

export const handleWishes = async (
	userProfile: UserProfile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile.wishes) return ok(undefined);

	const allWishes = [
		...(userProfile.wishes.CharacterEvent || []),
		...(userProfile.wishes.WeaponEvent || []),
		...(userProfile.wishes.Standard || []),
		...(userProfile.wishes.Beginner || []),
		...(userProfile.wishes.Chronicled || [])
	];

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
		await createMultipleWishes(newlyFormattedWishes);
	} else {
		const newWishes = filterNewWishes(newlyFormattedWishes, currentWishes);
		if (newWishes.length > 0) {
			await createMultipleWishes(newWishes);
		}
	}

	return ok(undefined);
};

const formatWishes = (wishes: IWish[], uid: string): Omit<Wish, 'createdAt'>[] => {
	return wishes.map((wish) => ({
		id: wish.number.toString(),
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
	currentWishes: Omit<Wish, 'createdAt'>[]
) => {
	const wishSet = new Set<string>(currentWishes.map((wish) => wish.id));

	return newWishes.filter((wish) => {
		return !wishSet.has(wish.id);
	});
};
