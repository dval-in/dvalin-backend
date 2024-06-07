import { User as PrismaUser } from '@prisma/client';
import { User } from '@prisma/client';

declare global {
	namespace Express {
		interface User extends PrismaUser {}
	}
}

declare module 'socket.io' {
	interface Socket {
		user?: User;
	}
}
