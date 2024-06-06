import expressSession from 'express-session';
import { config } from './envManager';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import type { Express } from 'express';
import { logToConsole } from './log';

const getDomain = (hostname: string): string => {
	if (hostname === 'localhost') {
		return hostname;
	}

	const splitHostname = hostname.split('.');
	splitHostname.reverse();
	return `${splitHostname[1]}.${splitHostname[0]}`;
};

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

export const setupSession = (app: Express) => {
	logToConsole(
		'Express-Session',
		`Cookiedomain: ${getDomain(new URL(config.BACKEND_URL).hostname)}`
	);

	app.use(session);
};
