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
				id: 'desc'
			}
		});

		if (wishes.length === 0) {
			return err(new Error('No wishes found'));
		}

		return ok(wishes);
	} catch (error) {
		return err(new Error('Failed to retrieve wishes'));
	}
};

export const getLatestWishByUid = async (uid: string): Promise<Result<Wish, Error>> => {
	try {
		const wish = await prisma.wish.findFirst({
			where: {
				uid
			},
			orderBy: {
				id: 'desc'
			}
		});

		if (!wish) {
			return err(new Error('No latest wish found'));
		}

		return ok(wish);
	} catch (error) {
		return err(new Error('Failed to retrieve latest wish'));
	}
};
