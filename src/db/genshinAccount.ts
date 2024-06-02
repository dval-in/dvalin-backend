import { GenshinAccount, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createGenshinAccount = async (
	genshinAccount: GenshinAccount
): Promise<GenshinAccount> => {
	return prisma.genshinAccount.create({
		data: {
			uid: genshinAccount.uid,
			userId: genshinAccount.userId,
			name: genshinAccount.name,
			server: genshinAccount.server,
			ar: genshinAccount.ar,
			wl: genshinAccount.wl
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
