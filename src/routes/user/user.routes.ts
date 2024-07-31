import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler.ts';
import { UserProfileService } from '../../services/userProfile.service.ts';
import { syncUserProfileQueue } from '../../queues/syncUserProfile.queue.ts';
import { getGenshinAccountByUid } from '../../db/models/genshinAccount';
import { logToConsole } from '../../utils/log';
import { Character } from '@prisma/client';
import {saveCharacters} from '../../db/models/character';

export class UserRoute {
	private readonly userProfileService = new UserProfileService();

	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/user', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}
			const userProfileResult = await this.userProfileService.getUserProfile(req.user.userId);
			userProfileResult.match(
				(userProfile) => sendSuccessResponse(res, { state: 'SUCCESS', data: userProfile }),
				(error) => {
					if (error.message.includes('No Genshin accounts')) {
						sendErrorResponse(res, 404, 'NO_GENSHIN_ACCOUNTS');
					} else {
						logToConsole('AuthService', error.message);
						sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
					}
				}
			);
		});

		this.app.post('/user/create', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}
			const data = req.body;
			const { userId } = req.user;
			if (!data || !userId) {
				sendErrorResponse(res, 400, 'MISSING_USER_PROFILE');
			}

			const uid = data.uid;
			const isUidExist = await getGenshinAccountByUid(uid);
			if (isUidExist.isOk()) {
				sendErrorResponse(res, 400, 'UID_ALREADY_EXISTS');
			}
			const config = data.config;
			const result = await this.userProfileService.createNewUser(uid, config, userId);
			result.match(
				async (genshinAccount) => {
					const alreadyExistingCharacter:(Partial<Character> & { key: string; uid: string })[]= [{key:'Amber', uid:genshinAccount.uid}, {key:'Kaeya', uid:genshinAccount.uid}, {key:'Lisa', uid:genshinAccount.uid}]; 
					await saveCharacters(alreadyExistingCharacter).then(
						() => sendSuccessResponse(res, { state: 'SUCCESS', data: genshinAccount }),
						async (_error) => {
							sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
						}
					)},
				async (_error) => {
					sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
				}
			);
		});

		this.app.post('/user/sync', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const userProfile = req.body;
			const { userId } = req.user;

			if (!userProfile || !userId) {
				sendErrorResponse(res, 400, 'MISSING_USER_PROFILE');
			}

			try {
				const runningJob = await syncUserProfileQueue.getJob(`${userId}syncUserProfile`);

				if (runningJob !== undefined) {
					sendSuccessResponse(res, { state: 'ALREADY_SYNCING' });
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

		this.app.post('/user/config', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}

			const { userId } = req.user;
			const { config } = req.body;
			if (!config || !userId) {
				sendErrorResponse(res, 400, 'MISSING_CONFIG');
			}
			const result = await this.userProfileService.updateConfig(userId, config);
			result.match(
				() => sendSuccessResponse(res, { state: 'SUCCESS' }),
				(error) => {
					logToConsole('AuthService', error.message);
					sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
				}
			);
		});

		this.app.delete('/user', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				sendErrorResponse(res, 401, 'UNAUTHORIZED');
			}
			const { userId } = req.user;
			const result = await this.userProfileService.deleteUserProfile(userId);
			req.session.destroy((err) => {
				if (err) {
					logToConsole('AuthService', 'Session destroy error:' + err);
				}
			});
			result.match(
				() => sendSuccessResponse(res, { state: 'SUCCESS' }),
				(_error) => {
					sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
				}
			);
		});
	}
}
