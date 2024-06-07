import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';
import { getUserProfile } from '../../services/userProfile';
import { importSyncQueue } from '../../queues/importSyncQueue';

export class UserRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/user', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			const userProfile = await getUserProfile(req.user.userId);

			sendSuccessResponse(res, { state: 'SUCCESS', data: userProfile });
		});
		this.app.post('/importsync', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}
			const userProfile = req.body.userProfile;
			const userId = req.user.userId;
			if (!userProfile || !userId) {
				return sendErrorResponse(res, 400, 'MISSING_USER_PROFILE');
			}
			const runningJob = await importSyncQueue.getJob(userId + 'importSync');

			if (runningJob !== undefined) {
				return sendSuccessResponse(res, { state: 'CREATED' });
			}

			await importSyncQueue.add(
				'IMPORT_SYNC_USER',
				{
					...userProfile,
					userId
				},
				{
					jobId: userId + 'importSync',
					removeOnFail: true,
					removeOnComplete: 5 * 60 * 1000
				}
			);

			sendSuccessResponse(res, { state: 'CREATED' });
		});
	}
}
