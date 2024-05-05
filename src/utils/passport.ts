import passport from 'passport';
import { User as PrismaUser } from '@prisma/client';
import type { Express } from 'express';
import { getUserById } from '../db/user';
import { SessionUser } from '../types/auth';

export const setupPassport = (app: Express) => {
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser<SessionUser>(
		(user: PrismaUser, cb: (err: null, serializedUser: SessionUser) => void) => {
			process.nextTick(() => {
				cb(null, { userId: user.userId });
			});
		}
	);

	passport.deserializeUser<SessionUser>(
		async (sessionUser: SessionUser, cb: (err: Error | null, user?: PrismaUser) => void) => {
			const prismaUser = await getUserById(sessionUser.userId);

			if (prismaUser) {
				cb(null, prismaUser);
			} else {
				cb(new Error('Invalid User'));
			}
		}
	);
};
