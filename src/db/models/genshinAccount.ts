import { GenshinAccount } from '@prisma/client';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export const createGenshinAccount = async (
	genshinAccount: Partial<GenshinAccount> & { uid: string; userId: string }
): Promise<Result<GenshinAccount, Error>> => {
	try {
		const createdAccount = await prisma.genshinAccount.create({
			data: {
				...genshinAccount,
				config: { create: {} }
			},
			include: {
				config: true
			}
		});

		return ok(createdAccount);
	} catch (error) {
		return err(new Error('Failed to create Genshin account'));
	}
};

export const getGenshinAccountByUid = async (
	uid: string
): Promise<Result<GenshinAccount, Error>> => {
	try {
		const account = await prisma.genshinAccount.findUnique({
			where: {
				uid
			}
		});

		if (!account) {
			return err(new Error('Genshin account not found'));
		}

		return ok(account);
	} catch (error) {
		return err(new Error('Failed to retrieve Genshin account'));
	}
};

export const getGenshinAccountsByUser = async (
	userId: string
): Promise<Result<GenshinAccount[], Error>> => {
	try {
		const accounts = await prisma.genshinAccount.findMany({
			where: {
				userId
			}
		});

		if (accounts.length === 0) {
			return err(new Error('No Genshin accounts found for user'));
		}

		return ok(accounts);
	} catch (error) {
		return err(new Error('Failed to retrieve Genshin accounts'));
	}
};
