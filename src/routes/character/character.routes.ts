import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler.ts';
import { characterService } from '../../services/character.service.ts';

export class CharacterRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/character', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const { user, character } = req.body;

			const response = await characterService.saveCharacterForUser(user.id, character);
			return response.match(
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
