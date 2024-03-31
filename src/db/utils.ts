import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// Let TypeScript infer the return type
const getUserFromProvider = async (providerId: string): Promise<User | null> => {
	return prisma.user.findUnique({
		where: {
			providerId
		}
	});
};

const createUser = async (providerId: string, name: string, email?: string): Promise<User> => {
	return prisma.user.create({
		data: {
			providerId,
			name,
			email
		}
	});
};

export { getUserFromProvider, createUser };
