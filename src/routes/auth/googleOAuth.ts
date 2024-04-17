import { type Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../../utils/envManager';
import { getDomain } from '../../utils/passport';
import { createUser, getUserFromProvider } from '../../db/user';

const setupGoogleOAuth = (app: Express): void => {
	app.get('/auth/google', passport.authenticate('google'));
	app.get(
		'/auth/google/callback',
		passport.authenticate('google', { failureRedirect: config.FRONTEND_URL + '/login' }),
		(req, res) => {
			res.cookie('isAuthenticated', 'true', {
				domain: getDomain(new URL(config.BACKEND_URL).hostname)
			});
			res.redirect(config.FRONTEND_URL);
		}
	);
	passport.use(
		new GoogleStrategy(
			{
				clientID: config.GOOGLE_CLIENT_ID,
				clientSecret: config.GOOGLE_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/google/callback',
				scope: ['profile', 'email']
			},
			async (accessToken, refreshToken, profile, cb) => {
				const email = profile.emails?.[0].value ?? '';
				let user = await getUserFromProvider(profile.id);
				if (user == null) {
					user = await createUser(profile.id, profile.displayName, email);
				}
				cb(null, user);
			}
		)
	);
};

export { setupGoogleOAuth };
