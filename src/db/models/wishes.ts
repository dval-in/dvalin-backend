import { Wish } from '@prisma/client';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export async function createMultipleWishes(
	wishes: Omit<Wish, 'createdAt'>[]
): Promise<Result<void, Error>> {
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
			where: {
				uid
			},
			orderBy: {
				order: 'desc'
			}
		});

		return ok(wishes);
	} catch (error) {
		return err(new Error('Failed to retrieve wishes'));
	}
};

export const getLatestWishByUidAndGachaType = async (
	uid: string,
	gachaType: string
): Promise<Result<Wish | undefined, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			where: {
				uid,
				gachaType: gachaType
			},
			orderBy: {
				order: 'desc'
			}
		});

		if (!wish) {
			return ok(undefined);
		}

		return ok(wish);
	} catch (error) {
		return err(new Error('Failed to retrieve latest wish'));
	}
};

export const getLatest4StarWishByUid = async (uid: string): Promise<Result<Wish | null, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			where: {
				uid,
				rankType: '4'
			},
			orderBy: {
				order: 'desc'
			}
		});

		if (!wish) {
			return ok(null);
		}

		return ok(wish);
	} catch (error) {
		return err(new Error('Failed to retrieve latest 4 star wish'));
	}
};

export const getLatest5StarWishByUid = async (uid: string): Promise<Result<Wish | null, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			where: {
				uid,
				rankType: '5'
			},
			orderBy: {
				order: 'desc'
			}
		});

		if (!wish) {
			return ok(null);
		}

		return ok(wish);
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
