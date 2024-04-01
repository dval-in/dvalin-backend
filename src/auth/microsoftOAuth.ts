import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { createUser, getUserFromProvider } from '../db/utils';
import { type Express } from 'express';
import passport from 'passport';
import { config } from '../utils/envManager';
import { Profile } from 'passport-google-oauth20';

const setupMicrosoftOAuth = (app: Express): void => {
	app.get('/auth/microsoft', passport.authenticate('microsoft'));

	app.get(
		'/auth/microsoft/callback',
		passport.authenticate('microsoft', { failureRedirect: '/login' }),
		(req, res) => {
			res.redirect('/');
		}
	);
	passport.use(
		new MicrosoftStrategy(
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
