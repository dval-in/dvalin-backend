import { Config } from '@prisma/client';
import { DBClient } from './prismaClient';

const prisma = DBClient.getInstance();

export const getConfigFromUid = async (uid: string) => {
	const config = await prisma.config.findUnique({
		where: {
			uid
		}
	});
	// Config is created on Account creation
	return config as Config;
};
