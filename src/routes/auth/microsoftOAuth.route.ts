import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { type Express } from 'express';
import passport from 'passport';
import { Profile } from 'passport-google-oauth20';
import { config } from '../../config/config';
import { createUser, getUserByAuth } from '../../db/models/user';
import { createAuth } from '../../db/models/auth';

const setupMicrosoftOAuth = (app: Express): void => {
	app.get('/auth/microsoft', passport.authenticate('microsoft'));

	app.get(
		'/auth/microsoft/callback',
		passport.authenticate('microsoft', {
			failureRedirect: config.FRONTEND_URL + '/login'
		}),
		(_req, res) => {
			res.redirect(config.FRONTEND_URL);
		}
	);
	passport.use(
		new MicrosoftStrategy(
			{
				clientID: config.MICROSOFT_CLIENT_ID,
				clientSecret: config.MICROSOFT_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/microsoft/callback',
				scope: ['user.read'],
				passReqToCallback: true
			},
			async (
				req: Express.Request,
				_accessToken: string,
				_refreshToken: string,
				profile: Profile,
				cb: (err?: Error | null, user?: Express.User, info?: object) => void
			) => {
				if (req.user === undefined) {
					const userResult = await getUserByAuth(profile.id, 'Microsoft');
					if (userResult.isErr()) {
						return cb(userResult.error, undefined);
					}

					let user = userResult.value;
					if (user === undefined) {
						const createUserResult = await createUser(profile.id, 'Microsoft');
						if (createUserResult.isErr()) {
							return cb(createUserResult.error, undefined);
						}
						user = createUserResult.value;
					}

					return cb(null, user);
				} else {
					const createAuthResult = await createAuth(
						profile.id,
						'Microsoft',
						req.user.userId
					);
					if (createAuthResult.isErr()) {
						return cb(createAuthResult.error, req.user);
					}

					return cb(null, req.user);
				}
			}
		)
	);
};

export { setupMicrosoftOAuth };
