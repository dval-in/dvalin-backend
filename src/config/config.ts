// config.ts

import { z } from 'zod';

import dotenv from 'dotenv';
import { logToConsole } from '../utils/log';

dotenv.config();

// Define the schema as before
const configSchema = z.object({
	GITHUB_CLIENT_ID: z.string().min(1),
	GITHUB_CLIENT_SECRET: z.string().min(1),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	MICROSOFT_CLIENT_ID: z.string().min(1),
	MICROSOFT_CLIENT_SECRET: z.string().min(1),
	DISCORD_CLIENT_ID: z.string().min(1),
	DISCORD_CLIENT_SECRET: z.string().min(1),
	COOKIE_SECRET: z.string().min(1),
	FRONTEND_URL: z.string().min(1),
	BACKEND_URL: z.string().min(1),
	BACKEND_PORT: z.number().min(1024).max(65535),
	DATABASE_URL: z.string().url(),
	REDIS_HOSTNAME: z.string().min(1),
	REDIS_PORT: z.number().min(1024).max(65535),
	REDIS_PASSWORD: z.string().min(0),
	DEBUG: z.boolean(),
	DATA_DIR: z.string().min(0)
});

// Validate the environment configuration immediately
const validatedConfig = configSchema.safeParse({
	GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
	MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
	DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
	COOKIE_SECRET: process.env.COOKIE_SECRET,
	FRONTEND_URL: process.env.FRONTEND_URL,
	BACKEND_URL: process.env.BACKEND_URL,
	BACKEND_PORT: Number(process.env.BACKEND_PORT),
	DATABASE_URL: process.env.DATABASE_URL,
	REDIS_HOSTNAME: process.env.REDIS_HOSTNAME,
	REDIS_PORT: Number(process.env.REDIS_PORT),
	REDIS_PASSWORD: process.env.REDIS_PASSWORD,
	DEBUG: process.env.DEBUG === 'true',
	DATA_DIR: process.env.DATA_DIR
});

if (!validatedConfig.success) {
	logToConsole('Config', 'Configuration validation failed : ' + validatedConfig.error);
	throw new Error('Configuration validation failed');
}

// Export the validated configuration as a singleton object
export const config: z.infer<typeof configSchema> = validatedConfig.data;
