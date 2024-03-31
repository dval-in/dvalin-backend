// config.ts

import { z } from 'zod'

import dotenv from 'dotenv'
dotenv.config()

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
  REDIS_URL: z.string().url()
})

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
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL
})

if (!validatedConfig.success) {
  console.error('Configuration validation failed', validatedConfig.error)
  throw new Error('Configuration validation failed')
}

// Export the validated configuration as a singleton object
export const config: z.infer<typeof configSchema> = validatedConfig.data
