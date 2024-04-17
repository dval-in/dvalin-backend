import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { type Express } from 'express';
import passport from 'passport';
import { Profile } from 'passport-google-oauth20';
import { config } from '../../utils/envManager';
import { getDomain } from '../../utils/passport';
import { createUser, getUserFromProvider } from '../../db/user';

const setupMicrosoftOAuth = (app: Express): void => {
	app.get('/auth/microsoft', passport.authenticate('microsoft'));

	app.get(
		'/auth/microsoft/callback',
		passport.authenticate('microsoft', {
			failureRedirect: config.FRONTEND_URL + '/login'
		}),
		(req, res) => {
			res.cookie('isAuthenticated', 'true', {
				domain: getDomain(new URL(config.BACKEND_URL).hostname)
			});
			res.redirect(config.FRONTEND_URL);
		}
	);
	passport.use(
		<passport.Strategy>new MicrosoftStrategy(
			{
				clientID: config.MICROSOFT_CLIENT_ID,
				clientSecret: config.MICROSOFT_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/microsoft/callback',
				scope: ['user.read']
			},
			async (
				accessToken: string,
				refreshToken: string,
				profile: Profile,
				cb: (err?: Error | null, user?: Express.User, info?: object) => void
			) => {
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

export { setupMicrosoftOAuth };
