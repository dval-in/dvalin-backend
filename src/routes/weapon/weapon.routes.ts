import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { weaponService } from '../../services/weapon.service';
import { MissingParametersError, NoAccountFoundError } from '../../utils/errors';

export class WeaponRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/weapon', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const { user, weapon } = req.body;

			try {
				await weaponService.saveWeaponForUser(user.id, weapon);
				sendSuccessResponse(res, { state: 'SUCCESS' });
			} catch (error) {
				if (error instanceof MissingParametersError) {
					sendErrorResponse(res, 400, error.message);
				} else if (error instanceof NoAccountFoundError) {
					sendErrorResponse(res, 403, error.message);
				} else {
					sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
				}
			}
		});
	}
}
