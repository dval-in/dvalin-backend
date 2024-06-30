import passport from 'passport';
import { User as PrismaUser } from '@prisma/client';
import type { Express } from 'express';
import { getUserById } from '../db/models/user';
import { SessionUser } from '../types/models/auth';
import { Result } from 'neverthrow';

/**
 * Initializes Passport and sets up session handling, serialization, and deserialization.
 *
 * @param {Express} app - The Express application instance.
 */
export const setupPassport = (app: Express): void => {
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
			const result: Result<PrismaUser | undefined, Error> = await getUserById(
				sessionUser.userId
			);

			result.match(
				(prismaUser) => cb(null, prismaUser),
				(error) => cb(error)
			);
		}
	);
};
