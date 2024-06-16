import { type Express } from 'express';
import { setupGitHubOAuth } from './githubOAuth.route';
import { setupGoogleOAuth } from './googleOAuth.route';
import { setupMicrosoftOAuth } from './microsoftOAuth.route';
import { authService } from '../../services/auth.service';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { setupDiscordOAuth } from './discordOAuth.route';

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

		this.app.get('/auth/status', async (req, res) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}
			const providers = await authService.getUserInfo(req.user.userId);
			if (providers.isErr()) {
				return sendErrorResponse(res, 404, 'USER_NOT_FOUND');
			}
			sendSuccessResponse(res, { user: req.user, providers: providers.value });
		});

		this.app.get('/auth/logout', (req, res) => {
			authService.logout(req, res);
		});
	}
}
