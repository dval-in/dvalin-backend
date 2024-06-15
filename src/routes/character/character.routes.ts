import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { characterService } from '../../services/character.service';
import { MissingParametersError, NoAccountFoundError } from '../../utils/errors';

export class CharacterRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/character', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const { user, character } = req.body;

			try {
				await characterService.saveCharacterForUser(user.id, character);
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
