import { config } from '../config/config';
import { logToConsole } from '../utils/log';

class AuthService {
	logout(req: any, res: any) {
		req.logout(() => {
			req.session.destroy((err: any) => {
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
