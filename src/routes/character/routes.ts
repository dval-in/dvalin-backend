import { saveCharacter } from '../../db/character';
import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';

export class CharacterRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/character', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			const { user, character } = req.body;
			if (!user.uid || !character || typeof character !== 'object' || !('id' in character)) {
				return sendErrorResponse(res, 400, 'MISSING_PARAMETERS');
			}
			await saveCharacter(character, user.uid);
			sendSuccessResponse(res, { state: 'SUCCESS' });
		});
	}
}
