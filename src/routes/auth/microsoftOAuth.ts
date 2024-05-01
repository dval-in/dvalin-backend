import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { type Express } from 'express';
import passport from 'passport';
import { Profile } from 'passport-google-oauth20';
import { config } from '../../utils/envManager';
import { getDomain } from '../../utils/passport';
import { createUser, getUserByAuth } from '../../db/user';
import { createAuth } from '../../db/auth';

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
				scope: ['user.read'],
				passReqToCallback: true
			},
			async (
				req: Express.Request,
				accessToken: string,
				refreshToken: string,
				profile: Profile,
				cb: (err?: Error | null, user?: Express.User, info?: object) => void
			) => {
				if (req.user === undefined) {
					let user = await getUserByAuth(profile.id, 'Microsoft');

					if (user === undefined) {
						user = await createUser(profile.id, 'Microsoft');
					}

					cb(null, user);
				} else {
					await createAuth(profile.id, 'Microsoft', req.user.userId);

					cb(null, req.user);
				}
			}
		)
	);
};

export { setupMicrosoftOAuth };
