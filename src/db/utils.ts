import { PrismaClient, type User, type GenshinAccount, type WishSave } from '@prisma/client';

const prisma = new PrismaClient();

const getUserFromProvider = async (providerId: string): Promise<User | null> => {
	return prisma.user.findUnique({
		where: {
			providerId
		}
	});
};

const createUser = async (providerId: string, name: string, email: string): Promise<User> => {
	return await prisma.user.create({
		data: {
			providerId,
			name,
			email
		}
	});
};

const linkGenshinAccountToUser = async (
	providerId: string,
	uid: string,
	name?: string
): Promise<GenshinAccount> => {
	return await prisma.genshinAccount.create({
		data: {
			providerId,
			uid,
			name
		}
	});
};

const createWishSave = async (
	uid: string,
	gachaType: string,
	itemId: string | null,
	count: string,
	time: Date,
	name: string,
	lang: string,
	itemType: string,
	rankType: string,
	gachaId: string
): Promise<WishSave> => {
	return await prisma.wishSave.create({
		data: {
			uid,
			gachaType,
			itemId,
			count,
			time,
			name,
			lang,
			itemType,
			rankType,
			gachaId
		}
	});
};

const getWishesFromGenshinAccount = async (uid: string): Promise<WishSave[]> => {
	return await prisma.wishSave.findMany({
		where: {
			uid
		}
	});
};

const getLatestWishFromGenshinAccount = async (uid: string): Promise<WishSave> => {
	const wishes = await prisma.wishSave.findFirst({
		where: {
			uid
		},
		orderBy: {
			time: 'desc'
		}
	});
	if (!wishes) {
		throw new Error('No wishes found for this account');
	}
	return wishes;
};

const getGenshinAccountFromUid = async (uid: string): Promise<GenshinAccount> => {
	const account = await prisma.genshinAccount.findUnique({
		where: {
			uid
		}
	});
	if (!account) {
		throw new Error('No account found for this uid');
	}
	return account;
};

const getGenshinAccountsFromUser = async (providerId: string): Promise<GenshinAccount[]> => {
	return await prisma.genshinAccount.findMany({
		where: {
			providerId
		}
	});
};

export {
	getUserFromProvider,
	createUser,
	linkGenshinAccountToUser,
	createWishSave,
	getLatestWishFromGenshinAccount,
	getGenshinAccountFromUid,
	getGenshinAccountsFromUser,
	getWishesFromGenshinAccount
};
