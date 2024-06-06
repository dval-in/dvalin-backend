import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { connection } from '../utils/queue';
import { UserProfile } from '../types/dvalin/dvalinFile';

export const IMPORT_SYNC_QUEUE_NAME = 'importSync';

export const importSyncQueue = new Queue<UserProfile & { userId: string }, 'IMPORT_SYNC_USER'>(
	IMPORT_SYNC_QUEUE_NAME,
	{
		connection
	}
);

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear import sync queue', () => {
	return importSyncQueue.clean(0, 0, 'completed').then((r) => {
		logToConsole('ImportSyncQueue', `Cleared ${r.length} Jobs`);
	});
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);
