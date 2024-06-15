import { config } from './config';

export const connection = {
	host: config.REDIS_HOSTNAME,
	port: config.REDIS_PORT,
	password: config.REDIS_PASSWORD
};
