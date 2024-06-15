import { type Express } from 'express';
import { setupGitHubOAuth } from './githubOAuth.route';
import { setupGoogleOAuth } from './googleOAuth.route';
import { setupMicrosoftOAuth } from './microsoftOAuth.route';
import { authService } from '../../services/auth.service';

export class AuthRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		setupGitHubOAuth(this.app);
		setupGoogleOAuth(this.app);
		setupMicrosoftOAuth(this.app);

		this.app.get('/auth/providers', (req, res) => {
			res.send({
				providers: authService.getProviders()
			});
		});

		this.app.get('/auth/logout', (req, res) => {
			authService.logout(req, res);
		});
	}
}
