import { User } from '@prisma/client';
import { Provider } from '../types/auth';

import { prisma } from './prismaclient'

export const createUser = async (providerId: string, provider: Provider): Promise<User> => {
	return prisma.user.create({
		data: {
			name: 'User',
			auths: {
				create: [{ providerId, provider }]
			}
		}
	});
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
	const user = await prisma.user.findUnique({
		where: {
			userId
		}
	});

	if (!user) {
		return undefined;
	}

	return user;
};

export const getUserByAuth = async (
	providerId: string,
	provider: Provider
): Promise<User | undefined> => {
	const user = await prisma.user.findFirst({
		where: {
			auths: {
				some: {
					providerId,
					provider
				}
			}
		}
	});

	if (!user) {
		return undefined;
	}

	return user;
};
