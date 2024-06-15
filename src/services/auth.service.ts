import { config } from '../config/config';

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
		return ['github', 'google', 'microsoft'];
	}
}

export const authService = new AuthService();
