import { PrismaClient, Wish } from '@prisma/client';

const prisma = new PrismaClient();

export async function createMultipleWishes(wishes: Omit<Wish, 'createdAt'>[]) {
	await prisma.wish.createMany({
		data: wishes,
		skipDuplicates: true
	});
}

export const getWishesByUid = async (uid: string): Promise<Wish[] | undefined> => {
	const wishes = await prisma.wish.findMany({
		where: {
			uid
		},
		orderBy: {
			id: 'desc'
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
			id: 'desc'
		}
	});

	if (!wishes) {
		return undefined;
	}

	return wishes;
};
