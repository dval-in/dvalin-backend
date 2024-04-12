import { User } from '@prisma/client';

type PrismaUser = User;

declare global {
	namespace Express {
		interface User extends PrismaUser {}
	}
}

declare module 'express-session' {
	interface Session {
		passport: { user: { providerId: string; name: string } };
	}
}
