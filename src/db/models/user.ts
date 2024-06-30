import { User } from '@prisma/client';
import { Provider } from '../../types/models/auth';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';
import { logToConsole } from '../../utils/log';

const prisma = DBClient.getInstance();

export const createUser = async (
	providerId: string,
	provider: Provider
): Promise<Result<User, Error>> => {
	try {
		const user = await prisma.user.create({
			data: {
				name: 'User',
				auths: {
					create: [{ providerId, provider }]
				}
			}
		});
		return ok(user);
	} catch (error) {
		return err(new Error('Failed to create user'));
	}
};

export const getUserById = async (userId: string): Promise<Result<User | undefined, Error>> => {
	try {
		const user = await prisma.user.findUnique({
			where: {
				userId
			}
		});

		if (!user) {
			return ok(undefined);
		}

		return ok(user);
	} catch (error) {
		return err(new Error('Failed to retrieve user by id'));
	}
};

export const getUserByAuth = async (
	providerId: string,
	provider: Provider
): Promise<Result<User | undefined, Error>> => {
	try {
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
			return ok(undefined);
		}

		return ok(user);
	} catch (error) {
		return err(new Error('Failed to retrieve user by auth'));
	}
};

export const deleteUserById = async (userId: string): Promise<Result<void, Error>> => {
	try {
		await prisma.user.delete({
			where: {
				userId
			}
		});
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to delete user'));
	}
};
