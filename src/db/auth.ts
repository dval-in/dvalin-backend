import { Auth } from '@prisma/client';
import { Provider } from '../types/auth';
import { prisma } from './prismaclient'

export const createAuth = async (
	providerId: string,
	provider: Provider,
	userId: string
): Promise<Auth> => {
	return prisma.auth.create({
		data: {
			providerId,
			provider,
			userId
		}
	});
};

export const getAuthById = async (id: string): Promise<Auth | undefined> => {
	const auth = await prisma.auth.findUnique({
		where: {
			id
		}
	});

	if (!auth) {
		return undefined;
	}

	return auth;
};

export const getAuthByProviderId = async (
	providerId: string,
	provider: Provider
): Promise<Auth | undefined> => {
	const auth = await prisma.auth.findFirst({
		where: {
			providerId,
			provider
		}
	});

	if (!auth) {
		return undefined;
	}

	return auth;
};

export const getAuthsByUser = async (userId: string): Promise<Auth[] | undefined> => {
	const auths = await prisma.auth.findMany({
		where: {
			userId
		}
	});

	if (auths.length === 0) {
		return undefined;
	}

	return auths;
};
