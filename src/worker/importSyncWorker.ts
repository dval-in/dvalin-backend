import { Worker } from 'bullmq';
import { logToConsole } from '../utils/log';
import { connection } from '../utils/queue';
import { WebSocketService } from '../services/websocket';
import { BKTree } from '../utils/BKTree';
import { UserProfile } from '../types/dvalin/dvalinFile';
import { IMPORT_SYNC_QUEUE_NAME, importSyncQueue } from '../queues/importSyncQueue';
import { importSync } from '../utils/sync';

export const setupImportSyncWorker = (bkTree: BKTree) => {
	const wss = WebSocketService.getInstance();
	const worker = new Worker<UserProfile & { userId: string }>(
		IMPORT_SYNC_QUEUE_NAME,
		async (job) => {
			const userProfile = job.data;
			if (!userProfile) {
				throw new Error('User profile is undefined');
			}
			const isPaimon = userProfile.format === 'paimon';

			return await importSync(userProfile, isPaimon, bkTree);
		},
		{
			connection
		}
	);

	worker.on('active', async (job) => {
		logToConsole(
			'ImportSyncWorker',
			`active: ${job.id}, remaining: ${await importSyncQueue.getWaitingCount()}`
		);

		wss.sendToastMessage(job.data.userId, 'server.userSync.active', 'info');
		wss.invalidateQuery(job.data.userId, 'userSyncStatus');
	});

	worker.on('completed', async (job, returnvalue: string) => {
		logToConsole(
			'ImportSyncWorker',
			`completed: ${job.id}, remaining: ${await importSyncQueue.getWaitingCount()}`
		);

		wss.invalidateQuery(job.data.userId, 'fetchUserProfile');
		wss.sendToastMessage(job.data.userId, 'server.userSync.success', 'success');
	});

	worker.on('failed', async (job, error) => {
		if (job !== undefined) {
			logToConsole(
				'ImportSyncWorker',
				`failed: ${job.id} (${error.message}), remaining: ${await importSyncQueue.getWaitingCount()}`
			);

			wss.invalidateQuery(job.data.userId, 'userSyncStatus');
			wss.sendToastMessage(job.data.userId, 'server.userSync.error', 'error');
		}
	});

	worker.on('error', (err) => {
		console.error(err);
	});
};
