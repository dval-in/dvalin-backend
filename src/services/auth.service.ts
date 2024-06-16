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

	getProviders() {
		return ['github', 'google', 'microsoft', 'discord'];
	}
}

export const authService = new AuthService();
