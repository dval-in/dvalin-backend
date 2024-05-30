import { PrismaClient } from '@prisma/client';

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client#the-number-of-prismaclient-instances-matters
// prisma client should have single connection

export class DBClient {
	private static prisma: PrismaClient;

	private constructor() {}

	public static getInstance(): PrismaClient {
		if (this.prisma) {
			return this.prisma;
		}
		this.prisma = new PrismaClient();
		return this.prisma;
	}
}
