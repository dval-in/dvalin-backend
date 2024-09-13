import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';
import { Wish } from '../../types/models/wish';
import { WishKeyBanner } from 'types/frontend/wish';

const prisma = DBClient.getInstance();

export async function createMultipleWishes(wishes: Wish[]): Promise<Result<void, Error>> {
	try {
		await prisma.wish.createMany({
			data: wishes,
			skipDuplicates: true
		});
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to create multiple wishes'));
	}
}

export const getWishesByUid = async (uid: string): Promise<Result<Wish[], Error>> => {
	try {
		const wishes = await prisma.wish.findMany({
			omit: {
				createdAt: true
			},
			where: {
				uid
			},
			orderBy: {
				order: 'desc'
			}
		});
		return ok(wishes as Wish[]);
	} catch (error) {
		return err(new Error('Failed to retrieve wishes'));
	}
};

export const getLatestWishByUidAndGachaType = async (
	uid: string,
	gachaType: WishKeyBanner
): Promise<Result<Wish | undefined, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			omit: {
				createdAt: true
			},
			where: {
				uid,
				gachaType:
					gachaType === '400' || gachaType === '301' ? { in: ['301', '400'] } : gachaType
			},
			orderBy: {
				order: 'desc'
			}
		});

		if (!wish) {
			return ok(undefined);
		}

		return ok(wish as Wish);
	} catch (error) {
		return err(new Error('Failed to retrieve latest wish', error));
	}
};

export const getLatest4StarWishByUid = async (
	uid: string,
	gachaType: WishKeyBanner
): Promise<Result<Wish | null, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			omit: {
				createdAt: true
			},
			where: {
				uid,
				rankType: '4',
				gachaType:
					gachaType === '400' || gachaType === '301' ? { in: ['301', '400'] } : gachaType
			},
			orderBy: {
				order: 'desc'
			}
		});

		if (!wish) {
			return ok(null);
		}

		return ok(wish as Wish);
	} catch (error) {
		return err(new Error('Failed to retrieve latest 4 star wish'));
	}
};

export const getLatest5StarWishByUid = async (
	uid: string,
	gachaType: WishKeyBanner
): Promise<Result<Wish | null, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			omit: {
				createdAt: true
			},
			where: {
				uid,
				rankType: '5',
				gachaType:
					gachaType === '400' || gachaType === '301' ? { in: ['301', '400'] } : gachaType
			},
			orderBy: {
				order: 'desc'
			}
		});

		if (!wish) {
			return ok(null);
		}

		return ok(wish as Wish);
	} catch (error) {
		return err(new Error('Failed to retrieve latest 5 star wish'));
	}
};

export const deleteWishesByUid = async (uid: string): Promise<Result<void, Error>> => {
	try {
		await prisma.wish.deleteMany({
			where: {
				uid
			}
		});

		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to delete wishes'));
	}
};
