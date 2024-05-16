import { GenshinAccount, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createGenshinAccount = async (
	uid: string,
	userId: string,
	name?: string,
	server?: string,
	ar?: number,
	wl?: number
): Promise<GenshinAccount> => {
	return prisma.genshinAccount.create({
		data: {
			uid,
			userId,
			name,
			server,
			ar,
			wl
		}
	});
};

export const getGenshinAccountByUid = async (uid: string): Promise<GenshinAccount | undefined> => {
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

export const getGenshinAccountsByUser = async (
	userId: string
): Promise<GenshinAccount[] | undefined> => {
	const accounts = await prisma.genshinAccount.findMany({
		where: {
			userId
		}
	});

	if (accounts.length === 0) {
		return undefined;
	}

	return accounts;
};
