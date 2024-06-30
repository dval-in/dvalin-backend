import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler.ts';
import { weaponService } from '../../services/weapon.service.ts';

export class WeaponRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/weapon', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const { user, weapon } = req.body;

			const response = await weaponService.saveWeaponForUser(user.id, weapon);
			response.match(
				() => sendSuccessResponse(res, { state: 'SUCCESS' }),
				(error) => {
					if (error.message === 'Missing parameters') {
						sendErrorResponse(res, 400, error.message);
					} else if (error.message === 'No account found') {
						sendErrorResponse(res, 403, error.message);
					} else {
						sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
					}
				}
			);
		});
	}
}
