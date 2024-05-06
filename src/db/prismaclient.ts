import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient();

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client#the-number-of-prismaclient-instances-matters
// prisma client should have single connection