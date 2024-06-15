import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { connection } from '../config/redis.config';
import { UserProfile } from '../types/frontend/dvalinFile';

export const SYNC_USER_PROFILE_QUEUE_NAME = 'syncUserProfile';

export const syncUserProfileQueue = new Queue<
	UserProfile & { userId: string },
	'SYNC_USER_PROFILE'
>(SYNC_USER_PROFILE_QUEUE_NAME, {
	connection
});

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear sync user profile queue', () => {
	return syncUserProfileQueue.clean(0, 0, 'completed').then((r) => {
		logToConsole('SyncUserProfileQueue', `Cleared ${r.length} Jobs`);
	});
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);
