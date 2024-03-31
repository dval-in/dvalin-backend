// config.ts

import { z } from 'zod';

import dotenv from 'dotenv';

dotenv.config();

// Define the schema as before
const configSchema = z.object({
	PORT: z.number().min(1024).max(65535),
	GITHUB_CLIENT_ID: z.string().min(1),
	GITHUB_CLIENT_SECRET: z.string().min(1),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	MICROSOFT_CLIENT_ID: z.string().min(1),
	MICROSOFT_CLIENT_SECRET: z.string().min(1),
	COOKIE_SECRET: z.string().min(1),
	DATABASE_URL: z.string().url(),
	DATABASE_HOSTNAME: z.string().min(1),
	DATABASE_PORT: z.number().min(1024).max(65535),
	DATABASE_USERNAME: z.string().min(1),
	DATABASE_PASSWORD: z.string().min(1),
	DATABASE_DATABASE: z.string().min(1),
	REDIS_HOSTNAME: z.string().min(1),
	REDIS_PORT: z.number().min(1024).max(65535),
	REDIS_PASSWORD: z.string().min(1)
});

// Validate the environment configuration immediately
const validatedConfig = configSchema.safeParse({
	PORT: Number(process.env.PORT),
	GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
	MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
	COOKIE_SECRET: process.env.COOKIE_SECRET,
	DATABASE_URL: `postgresql://${process.env.DATABASE_USERNAME}:${encodeURIComponent(process.env.DATABASE_PASSWORD!)}@${process.env.DATABASE_HOSTNAME}:${process.env.DATABASE_PORT}/${process.env.DATABASE_DATABASE}`,
	DATABASE_HOSTNAME: process.env.DATABASE_HOSTNAME,
	DATABASE_PORT: Number(process.env.DATABASE_PORT),
	DATABASE_USERNAME: process.env.DATABASE_USERNAME,
	DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
	DATABASE_DATABASE: process.env.DATABASE_DATABASE,
	REDIS_HOSTNAME: process.env.REDIS_HOSTNAME,
	REDIS_PORT: Number(process.env.REDIS_PORT),
	REDIS_PASSWORD: process.env.REDIS_PASSWORD
});

if (!validatedConfig.success) {
	console.error('Configuration validation failed', validatedConfig.error);
	throw new Error('Configuration validation failed');
}

// Export the validated configuration as a singleton object
export const config: z.infer<typeof configSchema> = validatedConfig.data;
