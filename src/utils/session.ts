import expressSession from 'express-session';
import { config } from '../config/config';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { logToConsole } from './log';

/**
 * Extracts the domain from a given hostname.
 *
 * @param {string} hostname - The hostname from which to extract the domain.
 * @returns {string} - The extracted domain.
 */
const getDomain = (hostname: string): string => {
	if (hostname === 'localhost') {
		return hostname;
	}

	const splitHostname = hostname.split('.');
	splitHostname.reverse();
	return `${splitHostname[1]}.${splitHostname[0]}`;
};

/**
 * Express session configuration.
 */
export const session = expressSession({
	name: 'dvalin-session',
	cookie: {
		maxAge: 2 * 7 * 24 * 60 * 60 * 1000, // 2 weeks
		domain: getDomain(new URL(config.BACKEND_URL).hostname),
		sameSite: 'lax',
		httpOnly: false
	},
	secret: config.COOKIE_SECRET,
	rolling: true,
	resave: false,
	saveUninitialized: false,
	store: new PrismaSessionStore(new PrismaClient(), {
		checkPeriod: 2 * 60 * 1000, // 2 minutes
		dbRecordIdIsSessionId: true,
		dbRecordIdFunction: undefined
	})
});

/**
 * Sets up the session middleware
 *
 * @param {Express} app - The Express application instance.
 */
export const setupSession = (app: Express): void => {
	const domain = getDomain(new URL(config.BACKEND_URL).hostname);
	logToConsole('Express-Session', `Cookiedomain: ${domain}`);

	app.use(session);
};
