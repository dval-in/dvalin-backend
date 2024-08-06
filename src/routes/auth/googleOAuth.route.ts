import { type Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../../config/config';
import { createUser, getUserByAuth } from '../../db/models/user';
import { createAuth } from '../../db/models/auth';

const setupGoogleOAuth = (app: Express): void => {
	app.get('/auth/google', passport.authenticate('google'));
	app.get(
		'/auth/google/callback',
		passport.authenticate('google', { failureRedirect: config.FRONTEND_URL + '/login' }),
		(_req, res) => {
			res.redirect(config.FRONTEND_URL);
		}
	);
	passport.use(
		new GoogleStrategy(
			{
				clientID: config.GOOGLE_CLIENT_ID,
				clientSecret: config.GOOGLE_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/google/callback',
				scope: ['profile'],
				passReqToCallback: true
			},
			async (req, _accessToken, _refreshToken, profile, cb) => {
				if (req.user === undefined) {
					const userResult = await getUserByAuth(profile.id, 'Google');
					if (userResult.isErr()) {
						return cb(userResult.error, undefined);
					}

					let user = userResult.value;
					if (user === undefined) {
						const createUserResult = await createUser(profile.id, 'Google');
						if (createUserResult.isErr()) {
							return cb(createUserResult.error, undefined);
						}
						user = createUserResult.value;
					}

					return cb(null, user);
				} else {
					const createAuthResult = await createAuth(
						profile.id,
						'Google',
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

export { setupGoogleOAuth };
