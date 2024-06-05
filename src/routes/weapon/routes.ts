import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';
import { getGenshinAccountsByUser } from '../../db/genshinAccount';
import { saveWeapon } from '../../db/weapons';

export class CharacterRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.post('/weapon', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			const { user, weapon } = req.body;
			if (!weapon || typeof weapon !== 'object' || !('key' in weapon)) {
				return sendErrorResponse(res, 400, 'MISSING_PARAMETERS');
			}

			const uid = await getGenshinAccountsByUser(user.id).then(
				(accounts) => accounts?.[0]?.uid
			);
			if (uid === undefined) {
				return sendErrorResponse(res, 403, 'NO_ACCOUNT_FOUND');
			}
			await saveWeapon({ ...weapon, uid: uid });
			sendSuccessResponse(res, { state: 'SUCCESS' });
		});
	}
}
