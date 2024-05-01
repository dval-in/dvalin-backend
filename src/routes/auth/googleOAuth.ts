import { type Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../../utils/envManager';
import { createUser, getUserByAuth } from '../../db/user';
import { createAuth } from '../../db/auth';

const setupGoogleOAuth = (app: Express): void => {
	app.get('/auth/google', passport.authenticate('google'));
	app.get(
		'/auth/google/callback',
		passport.authenticate('google', { failureRedirect: config.FRONTEND_URL + '/login' }),
		(req, res) => {
			res.redirect(config.FRONTEND_URL);
		}
	);
	passport.use(
		new GoogleStrategy(
			{
				clientID: config.GOOGLE_CLIENT_ID,
				clientSecret: config.GOOGLE_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/google/callback',
				scope: ['profile', 'email'],
				passReqToCallback: true
			},
			async (req, accessToken, refreshToken, profile, cb) => {
				if (req.user === undefined) {
					let user = await getUserByAuth(profile.id, 'Google');

					if (user === undefined) {
						user = await createUser(profile.id, 'Google');
					}

					cb(null, user);
				} else {
					await createAuth(profile.id, 'Google', req.user.userId);

					cb(null, req.user);
				}
			}
		)
	);
};

export { setupGoogleOAuth };
