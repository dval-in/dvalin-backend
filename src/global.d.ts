import { User } from '@prisma/client';

type PrismaUser = User;

declare global {
	namespace Express {
		interface User extends PrismaUser {}
	}
}
