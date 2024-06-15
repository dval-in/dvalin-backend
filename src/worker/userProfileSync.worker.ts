import { Worker } from 'bullmq';
import { logToConsole } from '../utils/log';
import { connection } from '../config/redis.config';
import { WebSocketService } from '../services/websocket.service';
import { BKTree } from '../handlers/BKTree';
import { UserProfile } from '../types/frontend/dvalinFile';
import {
	SYNC_USER_PROFILE_QUEUE_NAME,
	syncUserProfileQueue
} from '../queues/syncUserProfile.queue';
import { UserProfileService } from '../services/userProfile.service';
import { Index } from '../types/models/dataIndex';

const userProfileService = new UserProfileService();

export const setupUserProfileSyncWorker = (bkTree: BKTree, dataIndex: Index) => {
	const wss = WebSocketService.getInstance();
	const worker = new Worker<UserProfile & { userId: string }>(
		SYNC_USER_PROFILE_QUEUE_NAME,
		async (job) => {
			const userProfile = job.data;
			const isPaimon = userProfile.format === 'paimon';

			return await userProfileService.syncUserProfile(
				userProfile,
				isPaimon,
				bkTree,
				dataIndex
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

	worker.on('completed', async (job, returnvalue: string) => {
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
		console.error(err);
	});
};
