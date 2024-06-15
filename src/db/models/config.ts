import { DBClient } from '../prismaClient';
import { Config } from '@prisma/client';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export const getConfigFromUid = async (uid: string): Promise<Result<Config, Error>> => {
	try {
		const config = await prisma.config.findUnique({
			where: {
				uid
			}
		});

		if (!config) {
			return err(new Error('Config not found'));
		}

		return ok(config);
	} catch (error) {
		return err(new Error('Failed to retrieve config'));
	}
};
