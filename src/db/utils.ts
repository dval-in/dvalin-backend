import { PrismaClient, type User } from '@prisma/client'
const prisma = new PrismaClient()

// Let TypeScript infer the return type
const getUserFromProvider = async (providerId: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      providerId
    }
  })
}

const createUser = async (providerId: string, name: string, email?: string): Promise<User> => {
  return await prisma.user.create({
    data: {
      providerId,
      name,
      email
    }
  })
}

export { getUserFromProvider, createUser }
