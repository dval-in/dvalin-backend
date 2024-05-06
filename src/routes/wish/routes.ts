import { type Express } from 'express';

import { getGachaConfigList } from '../../utils/hoyolab';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';
import {
	WISH_HISTORY_QUEUE_RATE_LIMIT_DURATION,
	wishHistoryQueue
} from '../../queues/wishHistoryQueue';

export class WishHistoryRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/wishhistory', async (req, res) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}

			const runningJob = await wishHistoryQueue.getJob(req.user.userId + 'wish');

			if (runningJob !== undefined) {
				return sendSuccessResponse(res, { state: 'CREATED' });
			}

			const authkey =
				typeof req.query.authkey === 'string'
					? decodeURIComponent(req.query.authkey)
					: null;

			if (authkey === null || authkey === '') {
				return sendErrorResponse(res, 400, 'MISSING_AUTHKEY');
			}

			const configResponse = await getGachaConfigList(authkey);

			if (configResponse === undefined || configResponse.data === null) {
				sendErrorResponse(res, 500, 'AUTHKEY_INVALID');
				return;
			}

			await wishHistoryQueue.add(
				'FETCH_WISH_HISTORY',
				{
					authkey,
					userId: req.user.userId
				},
				{
					jobId: req.user.userId + 'wish',
					removeOnFail: false
				}
			);

			sendSuccessResponse(res, { state: 'CREATED' });
		});

		this.app.get('/wishhistory/status', async (req, res) => {
			if (req.user === undefined) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}

			const runningJob = await wishHistoryQueue.getJob(req.user.userId + 'wish');

			if (runningJob !== undefined) {
				const isCompleted = await runningJob.isCompleted();
				const isActive = await runningJob.isActive();
				const finishedOn = runningJob.finishedOn;

				if (isCompleted && finishedOn !== undefined) {
					return sendSuccessResponse(res, {
						state: 'COMPLETED_RATE_LIMIT',
						data: {
							completedTimestamp: finishedOn,
							rateLimitDuration: WISH_HISTORY_QUEUE_RATE_LIMIT_DURATION
						}
					});
				}

				if (isActive) {
					return sendSuccessResponse(res, {
						state: 'ACTIVE'
					});
				}

				const queueJobCount = await wishHistoryQueue.count();

				return sendSuccessResponse(res, {
					state: 'QUEUED',
					data: { count: queueJobCount }
				});
			}

			return sendSuccessResponse(res, { state: 'NO_JOB' });
		});
	}
}
