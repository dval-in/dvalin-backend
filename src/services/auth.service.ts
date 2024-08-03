import { Request, Response } from 'express';
import { config } from '../config/config';
import { logToConsole } from '../utils/log';

class AuthService {
	logout(req: Request, res: Response) {
		req.logout(() => {
			req.session.destroy((err) => {
				if (err) {
					logToConsole('AuthService', 'Session destroy error:' + err);
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
