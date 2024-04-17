import passport from 'passport';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { getUserFromProvider } from '../db/user';
import expressSession from 'express-session';
import { config } from './envManager';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import type { Express } from 'express';
import { logToConsole } from './log';

interface SessionUser {
	providerId: string;
	name: string;
}

export const getDomain = (hostname: string): string => {
	if (hostname === 'localhost') {
		return hostname;
	}

	const splitHostname = hostname.split('.');
	splitHostname.reverse();
	return `${splitHostname[1]}.${splitHostname[0]}`;
};

export const setupPassport = (app: Express) => {
	logToConsole('Passport', getDomain(new URL(config.BACKEND_URL).hostname));

	app.use(
		expressSession({
			name: 'dvalin-session',
			cookie: {
				maxAge: 7 * 24 * 60 * 60 * 1000, // ms
				domain: getDomain(new URL(config.BACKEND_URL).hostname),
				sameSite: 'lax',
				httpOnly: false
			},
			secret: config.COOKIE_SECRET,
			resave: true,
			saveUninitialized: true,
			store: new PrismaSessionStore(new PrismaClient(), {
				checkPeriod: 2 * 60 * 1000, // ms
				dbRecordIdIsSessionId: true,
				dbRecordIdFunction: undefined
			})
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser<SessionUser>(
		(user: PrismaUser, cb: (err: null, serializedUser: SessionUser) => void) => {
			process.nextTick(() => {
				cb(null, { providerId: user.providerId, name: user.name ?? '' });
			});
		}
	);

	passport.deserializeUser<SessionUser>(
		async (sessionUser: SessionUser, cb: (err: null, user?: PrismaUser) => void) => {
			const prismaUser = await getUserFromProvider(sessionUser.providerId);
			if (prismaUser) {
				cb(null, prismaUser);
			}
		}
	);
};
