import { Auth } from '@prisma/client';
import { Provider } from '../../types/models/auth';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export const createAuth = async (
	providerId: string,
	provider: Provider,
	userId: string
): Promise<Result<Auth, Error>> => {
	try {
		const auth = await prisma.auth.create({
			data: {
				providerId,
				provider,
				userId
			}
		});
		return ok(auth);
	} catch (error) {
		return err(new Error('Failed to create auth'));
	}
};

export const getAuthById = async (id: string): Promise<Result<Auth, Error>> => {
	try {
		const auth = await prisma.auth.findUnique({
			where: {
				id
			}
		});

		if (!auth) {
			return err(new Error('Auth not found'));
		}

		return ok(auth);
	} catch (error) {
		return err(new Error('Failed to retrieve auth by id'));
	}
};

export const getAuthByProviderId = async (
	providerId: string,
	provider: Provider
): Promise<Result<Auth, Error>> => {
	try {
		const auth = await prisma.auth.findFirst({
			where: {
				providerId,
				provider
			}
		});

		if (!auth) {
			return err(new Error('Auth not found'));
		}

		return ok(auth);
	} catch (error) {
		return err(new Error('Failed to retrieve auth by provider id'));
	}
};

export const getAuthsByUser = async (userId: string): Promise<Result<Auth[], Error>> => {
	try {
		const auths = await prisma.auth.findMany({
			where: {
				userId
			}
		});

		if (auths.length === 0) {
			return err(new Error('No auths found for user'));
		}

		return ok(auths);
	} catch (error) {
		return err(new Error('Failed to retrieve auths by user'));
	}
};

export const getUserById = async (id: string): Promise<Result<Auth, Error>> => {
	try {
		const user = await prisma.auth.findUnique({
			where: {
				id
			}
		});

		if (!user) {
			return err(new Error('User not found'));
		}

		return ok(user);
	} catch (error) {
		return err(new Error('Failed to retrieve user by id'));
	}
};
