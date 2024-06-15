import { GenshinAccount } from '@prisma/client';
import { DBClient } from '../prismaClient';

const prisma = DBClient.getInstance();

export const createGenshinAccount = async (
	genshinAccount: Partial<GenshinAccount> & { uid: string; userId: string }
): Promise<GenshinAccount> => {
	const createdAccount = await prisma.genshinAccount.create({
		data: {
			...genshinAccount,
			config: { create: {} }
		},
		include: {
			config: true
		}
	});

	return createdAccount;
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
