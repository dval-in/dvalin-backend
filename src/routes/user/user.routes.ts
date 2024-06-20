import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { UserProfileService } from '../../services/userProfile.service';
import { syncUserProfileQueue } from '../../queues/syncUserProfile.queue';

export class UserRoute {
	private userProfileService = new UserProfileService();

	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/user', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const userProfileResult = await this.userProfileService.getUserProfile(req.user.userId);
			userProfileResult.match(
				(userProfile) => sendSuccessResponse(res, { state: 'SUCCESS', data: userProfile }),
				(error) => sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR')
			);
		});

		this.app.post('/user/sync', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const { userProfile } = req.body;
			const { userId } = req.user;

			if (!userProfile || !userId) {
				return sendErrorResponse(res, 400, 'MISSING_USER_PROFILE');
			}

			try {
				const runningJob = await syncUserProfileQueue.getJob(`${userId}syncUserProfile`);

				if (runningJob !== undefined) {
					return sendSuccessResponse(res, { state: 'ALREADY_SYNCING' });
				}

				await syncUserProfileQueue.add(
					'SYNC_USER_PROFILE',
					{ ...userProfile, userId },
					{
						jobId: `${userId}syncUserProfile`,
						removeOnFail: true,
						removeOnComplete: true
					}
				);

				sendSuccessResponse(res, { state: 'SYNC_STARTED' });
			} catch (error) {
				sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
			}
		});
	}
}
