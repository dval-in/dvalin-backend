import { type Express } from 'express';
import { setupGitHubOAuth } from './githubOAuth.route.ts';
import { setupGoogleOAuth } from './googleOAuth.route.ts';
import { setupMicrosoftOAuth } from './microsoftOAuth.route.ts';
import { authService } from '../../services/auth.service.ts';
import { setupDiscordOAuth } from './discordOAuth.route.ts';

export class AuthRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		setupGitHubOAuth(this.app);
		setupGoogleOAuth(this.app);
		setupMicrosoftOAuth(this.app);
		setupDiscordOAuth(this.app);

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
