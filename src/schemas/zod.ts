import z from 'zod'

const configSchema = z.object({
  PORT: z.number().min(1024).max(65535),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  MICROSOFT_CLIENT_ID: z.string().min(1),
  MICROSOFT_CLIENT_SECRET: z.string().min(1),
  COOKIE_SECRET: z.string().min(1),
  DATABASE_URL: z.string().url()
})
