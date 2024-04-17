import { GenshinAccount, PrismaClient, User, WishSave } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserFromProvider = async (providerId: string): Promise<User | null> => {
	return prisma.user.findUnique({
		where: {
			providerId
		}
	});
};

export const createUser = async (
	providerId: string,
	name: string,
	email: string
): Promise<User> => {
	return prisma.user.create({
		data: {
			providerId,
			name,
			email
		}
	});
};

export const linkGenshinAccountToUser = async (
	providerId: string,
	uid: string,
	name?: string
): Promise<GenshinAccount> => {
	return prisma.genshinAccount.create({
		data: {
			providerId,
			uid,
			name
		}
	});
};

export const getWishesFromGenshinAccount = async (uid: string): Promise<WishSave[]> => {
	return prisma.wishSave.findMany({
		where: {
			uid
		}
	});
};

export const getLatestWishFromGenshinAccount = async (
	uid: string
): Promise<WishSave | undefined> => {
	const wishes = await prisma.wishSave.findFirst({
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

export const getGenshinAccountFromUid = async (
	uid: string
): Promise<GenshinAccount | undefined> => {
	const account = await prisma.genshinAccount.findUnique({
		where: {
			uid
		}
	});

	if (!account) {
		return undefined;
	}

	return account;
};

export const getGenshinAccountsFromUser = async (providerId: string): Promise<GenshinAccount[]> => {
	return prisma.genshinAccount.findMany({
		where: {
			providerId
		}
	});
};

export async function saveWishesInBulk(
	wishesToSave: Array<{
		gachaType: string;
		itemId: string | null;
		count: string;
		time: Date;
		name: string;
		lang: string;
		itemType: string;
		rankType: string;
		gachaId: string;
		uid: string;
	}>
) {
	await prisma.wishSave.createMany({
		data: wishesToSave,
		skipDuplicates: true
	});
}
