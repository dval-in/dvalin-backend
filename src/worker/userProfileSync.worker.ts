import { Worker } from 'bullmq';
import { logToConsole } from '../utils/log';
import { connection } from '../config/redis.config.ts';
import { WebSocketService } from '../services/websocket.service.ts';
import { UserProfile } from '../types/frontend/dvalinFile';
import {
	SYNC_USER_PROFILE_QUEUE_NAME,
	syncUserProfileQueue
} from '../queues/syncUserProfile.queue.ts';
import { UserProfileService } from '../services/userProfile.service.ts';
import { PaimonFile } from '../types/frontend/paimonFile.ts';

const userProfileService = new UserProfileService();

export const setupUserProfileSyncWorker = () => {
	const wssResult = WebSocketService.getInstance();
	if (wssResult.isErr()) {
		logToConsole(
			'UserProfileSync.worker',
			'Failed to get WebSocketService instance: ' + wssResult.error.message
		);
		return;
	}
	const wss = wssResult.value;

	const worker = new Worker<(UserProfile | PaimonFile) & { userId: string }>(
		SYNC_USER_PROFILE_QUEUE_NAME,
		async (job) => {
			const userProfile = job.data;
			const result = await userProfileService.syncUserProfile(userProfile);
			return result.match(
				(data) => data,
				(error) => {
					throw error;
				}
			);
		},
		{
			connection
		}
	);

	worker.on('active', async (job) => {
		logToConsole(
			'UserProfileSyncWorker',
			`active: ${job.id}, remaining: ${await syncUserProfileQueue.getWaitingCount()}`
		);

		wss.sendToastMessage(job.data.userId, 'server.userSync.active', 'info');
		wss.invalidateQuery(job.data.userId, 'userSyncStatus');
	});

	worker.on('completed', async (job, _returnvalue) => {
		logToConsole(
			'UserProfileSyncWorker',
			`completed: ${job.id}, remaining: ${await syncUserProfileQueue.getWaitingCount()}`
		);

		wss.invalidateQuery(job.data.userId, 'fetchUserProfile');
		wss.sendToastMessage(job.data.userId, 'server.userSync.success', 'success');
	});

	worker.on('failed', async (job, error) => {
		if (job !== undefined) {
			logToConsole(
				'UserProfileSyncWorker',
				`failed: ${job.id} (${error.message}), remaining: ${await syncUserProfileQueue.getWaitingCount()}`
			);

			wss.invalidateQuery(job.data.userId, 'userSyncStatus');
			wss.sendToastMessage(job.data.userId, 'server.userSync.error', 'error');
		}
	});

	worker.on('error', (err) => {
		logToConsole('UserProfileSync.worker', err.message);
	});
};
