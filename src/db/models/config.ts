import { DBClient } from '../prismaClient';

const prisma = DBClient.getInstance();

export const getConfigFromUid = async (uid: string) => {
	const config = await prisma.config.findUnique({
		where: {
			uid
		}
	});
	// should "never" happen as config is created on user creation
	if (!config) {
		throw new Error('Config not found');
	}
	return config;
};
