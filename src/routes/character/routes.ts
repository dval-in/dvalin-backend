import { saveCharacter } from '../../db/character';
import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';
import { getGenshinAccountsByUser } from '../../db/genshinAccount';

export class CharacterRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/character', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			const { user, character } = req.body;
			if (!character || typeof character !== 'object' || !('key' in character)) {
				return sendErrorResponse(res, 400, 'MISSING_PARAMETERS');
			}

			const uid = await getGenshinAccountsByUser(user.id).then(
				(accounts) => accounts?.[0]?.uid
			);
			if (uid === undefined) {
				return sendErrorResponse(res, 403, 'NO_ACCOUNT_FOUND');
			}
			await saveCharacter({ ...character, uid: uid });
			sendSuccessResponse(res, { state: 'SUCCESS' });
		});
	}
}