import { Wish } from '@prisma/client';
import { DBClient } from './prismaclient';

const prisma = DBClient.getInstance();

export async function createMultipleWishes(wishes: Omit<Wish, 'id' | 'createdAt'>[]) {
	await prisma.wish.createMany({
		data: wishes,
		skipDuplicates: true
	});
}

export const getWishesByUid = async (uid: string): Promise<Wish[] | undefined> => {
	const wishes = await prisma.wish.findMany({
		where: {
			uid
		}
	});

	if (wishes.length === 0) {
		return undefined;
	}

	return wishes;
};

export const getLatestWishByUid = async (uid: string): Promise<Wish | undefined> => {
	const wishes = await prisma.wish.findFirst({
		where: {
			uid
		},
		orderBy: {
			time: 'desc'
		}
	});

	if (!wishes) {
		return undefined;
	}

	return wishes;
};
