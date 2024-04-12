import { type Express } from 'express';
import { setupGitHubOAuth } from './githubOAuth';
import { setupGoogleOAuth } from './googleOAuth';
import { setupMicrosoftOAuth } from './microsoftOAuth';
import { config } from '../utils/envManager';

export class AuthRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		setupGitHubOAuth(this.app);
		setupGoogleOAuth(this.app);
		setupMicrosoftOAuth(this.app);

		this.app.get('/auth/providers', (req, res) => {
			res.send({
				providers: ['github', 'google', 'microsoft']
			});
		});

		this.app.get('/auth/logout', (req, res) => {
			req.logout(() => {
				req.session.destroy((err) => {
					if (err) {
						console.error('Session destroy error:', err);
					} else {
						res.cookie('isAuthenticated', false);
						res.redirect(config.FRONTEND_URL);
					}
				});
			});
		});
	}
}
