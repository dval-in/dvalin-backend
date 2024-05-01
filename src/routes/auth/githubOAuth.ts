import { Strategy as GitHubStrategy } from 'passport-github';
import { type Express } from 'express';
import passport from 'passport';
import { config } from '../../utils/envManager';
import { createUser, getUserByAuth } from '../../db/user';
import { createAuth } from '../../db/auth';

const setupGitHubOAuth = (app: Express): void => {
	app.get('/auth/github', passport.authenticate('github'));
	app.get(
		'/auth/github/callback',
		passport.authenticate('github', { failureRedirect: config.FRONTEND_URL + '/login' }),
		(req, res) => {
			res.redirect(config.FRONTEND_URL);
		}
	);
	passport.use(
		new GitHubStrategy(
			{
				clientID: config.GITHUB_CLIENT_ID,
				clientSecret: config.GITHUB_CLIENT_SECRET,
				callbackURL: config.BACKEND_URL + '/auth/github/callback',
				passReqToCallback: true
			},
			async (req, accessToken, refreshToken, profile, cb) => {
				if (req.user === undefined) {
					let user = await getUserByAuth(profile.id, 'Github');

					if (user === undefined) {
						user = await createUser(profile.id, 'Github');
					}

					cb(null, user);
				} else {
					await createAuth(profile.id, 'Github', req.user.userId);

					cb(null, req.user);
				}
			}
		)
	);
};

export { setupGitHubOAuth };
