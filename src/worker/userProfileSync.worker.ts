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
import { Result, ok, err } from 'neverthrow';

const userProfileService = new UserProfileService();

export const setupUserProfileSyncWorker = (bkTree: BKTree, dataIndex: Index) => {
	const wssResult = WebSocketService.getInstance();
	if (wssResult.isErr()) {
		console.error('Failed to get WebSocketService instance:', wssResult.error.message);
		return;
	}
	const wss = wssResult.value;

	const worker = new Worker<UserProfile & { userId: string }>(
		SYNC_USER_PROFILE_QUEUE_NAME,
		async (job) => {
			const result = await processUserProfileSync(job.data, bkTree, dataIndex);
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

	worker.on('completed', async (job, returnvalue) => {
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

/**
 * Processes the user profile sync job and returns a Result type.
 *
 * @param {UserProfile & { userId: string }} userProfile - The user profile data.
 * @param {BKTree} bkTree - The BKTree instance.
 * @param {Index} dataIndex - The data index.
 * @returns {Promise<Result<string, Error>>} - The result of the operation.
 */
const processUserProfileSync = async (
	userProfile: UserProfile & { userId: string },
	bkTree: BKTree,
	dataIndex: Index
): Promise<Result<string, Error>> => {
	try {
		const isPaimon = userProfile.format === 'paimon';
		const result = await userProfileService.syncUserProfile(
			userProfile,
			isPaimon,
			bkTree,
			dataIndex
		);
		return ok(result);
	} catch (error) {
		return err(new Error('Failed to sync user profile'));
	}
};
