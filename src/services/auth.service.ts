import { err, ok } from 'neverthrow';
import { config } from '../config/config';
import { logToConsole } from '../utils/log';
import { getAuthsByUser } from '../db/models/auth';

class AuthService {
	logout(req: any, res: any) {
		req.logout(() => {
			req.session.destroy((err: any) => {
				if (err) {
					console.error('Session destroy error:', err);
				}
				res.redirect(config.FRONTEND_URL);
			});
		});
	}

	async getUserInfo(userId: string) {
		const userResult = await getAuthsByUser(userId);
		if (userResult.isErr()) {
			logToConsole(
				'AuthService',
				`Failed to retrieve user by id: ${userResult.error.message}`
			);
			return err(new Error('No user found for this id'));
		}
		return ok(userResult.value);
	}

	getProviders() {
		return ['github', 'google', 'microsoft', 'discord'];
	}
}

export const authService = new AuthService();
