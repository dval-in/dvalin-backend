import { Strategy as GitHubStrategy } from 'passport-github';
import { type Express } from 'express';
import passport from 'passport';
import { config } from '../../config/config';
import { createUser, getUserByAuth } from '../../db/models/user';
import { createAuth } from '../../db/models/auth';

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
					const userResult = await getUserByAuth(profile.id, 'Github');
					if (userResult.isErr()) {
						return cb(userResult.error, undefined);
					}

					let user = userResult.value;
					if (user === undefined) {
						const createUserResult = await createUser(profile.id, 'Github');
						if (createUserResult.isErr()) {
							return cb(createUserResult.error, undefined);
						}
						user = createUserResult.value;
					}

					cb(null, user);
				} else {
					const createAuthResult = await createAuth(
						profile.id,
						'Github',
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

export { setupGitHubOAuth };
