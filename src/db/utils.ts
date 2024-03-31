import { PrismaClient, User, GenshinAccount, WishSave } from '@prisma/client';

const prisma = new PrismaClient();

const getUserFromProvider = async (providerId: string): Promise<User | null> => {
	return prisma.user.findUnique({
		where: {
			providerId
		}
	});
};

const createUser = async (providerId: string, name: string, email: string): Promise<User> => {
	return prisma.user.create({
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
	return prisma.genshinAccount.create({
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
	return prisma.wishSave.create({
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
	return prisma.wishSave.findMany({
		where: {
			uid
		}
	});
};

const getLatestWishFromGenshinAccount = async (uid: string): Promise<WishSave | undefined> => {
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

const getGenshinAccountFromUid = async (uid: string): Promise<GenshinAccount | undefined> => {
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

const getGenshinAccountsFromUser = async (providerId: string): Promise<GenshinAccount[]> => {
	return prisma.genshinAccount.findMany({
		where: {
			providerId
		}
	});
};

async function saveWishesInBulk(
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
	try {
		await prisma.wishSave.createMany({
			data: wishesToSave,
			skipDuplicates: true
		});
		console.log('[prisma] All wishes have been saved');
	} catch (error) {
		console.error('[prisma] An error occurred during the bulk save:', error);
	}
}

export {
	getUserFromProvider,
	createUser,
	linkGenshinAccountToUser,
	createWishSave,
	getLatestWishFromGenshinAccount,
	getGenshinAccountFromUid,
	getGenshinAccountsFromUser,
	getWishesFromGenshinAccount,
	saveWishesInBulk
};
