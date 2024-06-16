import {
	Strategy as DiscordStrategy,
	Profile,
	VerifyCallback
} from '@oauth-everything/passport-discord';
import { Request, type Express } from 'express';
import passport from 'passport';
import { config } from '../../config/config';
import { createUser, getUserByAuth } from '../../db/models/user';
import { createAuth } from '../../db/models/auth';

const setupDiscordOAuth = (app: Express): void => {
	app.get('/auth/discord', passport.authenticate('discord'));
	app.get(
		'/auth/discord/callback',
		passport.authenticate('discord', { failureRedirect: config.FRONTEND_URL + '/login' }),
		(req, res) => {
			res.redirect(config.FRONTEND_URL);
		}
	);

	passport.use(
		new DiscordStrategy(
			{
				clientID: config.DISCORD_CLIENT_ID,
				clientSecret: config.DISCORD_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/discord/callback',
				scope: ['identify'],
				passReqToCallback: true
			},
			async (
				req: Request,
				accessToken: string,
				refreshToken: string,
				profile: Profile,
				cb: VerifyCallback
			) => {
				if (req.user === undefined) {
					const userResult = await getUserByAuth(profile.id, 'Discord');
					if (userResult.isErr()) {
						return cb(userResult.error, undefined);
					}

					let user = userResult.value;
					if (user === undefined) {
						const createUserResult = await createUser(profile.id, 'Discord');
						if (createUserResult.isErr()) {
							return cb(createUserResult.error, undefined);
						}
						user = createUserResult.value;
					}

					cb(null, user);
				} else {
					const createAuthResult = await createAuth(
						profile.id,
						'Discord',
						req.user.userId
					);
					if (createAuthResult.isErr()) {
						return cb(createAuthResult.error, undefined);
					}

					cb(null, req.user);
				}
			}
		)
	);
};

export { setupDiscordOAuth };
