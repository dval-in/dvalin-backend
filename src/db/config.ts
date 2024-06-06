import { DBClient } from './prismaClient';

const prisma = DBClient.getInstance();

export const getConfigFromUid = async (uid: string) => {
	const config = await prisma.config.findUnique({
		where: {
			uid
		}
	});
	return config;
};
