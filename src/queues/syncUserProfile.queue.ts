import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { connection } from '../config/redis.config';
import { UserProfile } from '../types/frontend/dvalinFile';
import { Result, ok, err } from 'neverthrow';
import { PaimonFile } from '../types/frontend/paimonFIle';

export const SYNC_USER_PROFILE_QUEUE_NAME = 'syncUserProfile';

export const syncUserProfileQueue = new Queue<
	(UserProfile | PaimonFile) & { userId: string },
	'SYNC_USER_PROFILE'
>(SYNC_USER_PROFILE_QUEUE_NAME, {
	connection
});

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear sync user profile queue', async () => {
	const result: Result<number, Error> = await clearSyncUserProfileQueue();
	result.match(
		(clearedJobsCount) => {
			logToConsole('SyncUserProfileQueue', `Cleared ${clearedJobsCount} Jobs`);
		},
		(error) => {
			logToConsole('SyncUserProfileQueue', `Error clearing jobs: ${error.message}`);
		}
	);
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);

/**
 * Clears completed jobs from the sync user profile queue.
 *
 * @returns {Promise<Result<number, Error>>} - The result of the operation, containing either the number of cleared jobs or an error.
 */
const clearSyncUserProfileQueue = async (): Promise<Result<number, Error>> => {
	try {
		const clearedJobs = await syncUserProfileQueue.clean(0, 0, 'completed');
		return ok(clearedJobs.length);
	} catch (error) {
		return err(new Error('Failed to clear sync user profile queue'));
	}
};
