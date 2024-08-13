import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { WishQueueData } from '../types/models/queue';
import { connection } from '../config/redis.config.ts';
import { Wish } from '@prisma/client';
import { Result, ok, err } from 'neverthrow';

export const WISH_QUEUE_NAME = 'wish';
export const WISH_QUEUE_RATE_LIMIT_DURATION = 60 * 60 * 1000;
export const wishQueue = new Queue<WishQueueData, Wish[], 'FETCH_WISH'>(WISH_QUEUE_NAME, {
	connection
});

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

const wishQueueHasAnActiveJob = async (): Promise<Result<boolean, Error>> => {
	try {
		const activeJobs = await wishQueue.getActiveCount();
		return ok(activeJobs > 0);
	} catch (error) {
		return err(new Error('Failed to get active jobs count'));
	}
};

const pauseWishQueue = async (): Promise<Result<void, Error>> => {
	try {
		await wishQueue.pause();
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to pause wish queue'));
	}
};

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
