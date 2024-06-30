import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { WishQueueData } from '../types/models/queue';
import { connection } from '../config/redis.config';
import { Wish } from '@prisma/client';
import { Result, ok, err } from 'neverthrow';

export const WISH_QUEUE_NAME = 'wish';
export const WISH_QUEUE_RATE_LIMIT_DURATION = 1000; // 60 * 60 *
export const wishQueue = new Queue<WishQueueData, Omit<Wish, 'createdAt'>[], 'FETCH_WISH'>(
	WISH_QUEUE_NAME,
	{
		connection
	}
);

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear wish queue', async () => {
	const result: Result<number, Error> = await clearWishQueue();
	result.match(
		(clearedJobsCount) => {
			logToConsole('WishQueue', `Cleared ${clearedJobsCount} Jobs`);
		},
		(error) => {
			logToConsole('WishQueue', `Error clearing jobs: ${error.message}`);
		}
	);
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);

/**
 * Clears completed jobs from the wish queue.
 *
 * @returns {Promise<Result<number, Error>>} - The result of the operation, containing either the number of cleared jobs or an error.
 */
const clearWishQueue = async (): Promise<Result<number, Error>> => {
	try {
		const clearedJobs = await wishQueue.clean(WISH_QUEUE_RATE_LIMIT_DURATION, 0, 'completed');
		return ok(clearedJobs.length);
	} catch (error) {
		return err(new Error('Failed to clear wish queue'));
	}
};
