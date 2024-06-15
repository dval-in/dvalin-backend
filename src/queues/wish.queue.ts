import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { WishQueueData } from '../types/models/queue';
import { connection } from '../config/redis.config';
import { Wish } from '@prisma/client';
import { QueueError } from '../utils/errors';

export const WISH_QUEUE_NAME = 'wish';
export const WISH_QUEUE_RATE_LIMIT_DURATION = 60 * 60 * 1000;

export const wishQueue = new Queue<WishQueueData, Omit<Wish, 'createdAt'>[], 'FETCH_WISH'>(
	WISH_QUEUE_NAME,
	{
		connection
	}
);

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear wish queue', async () => {
	try {
		const clearedJobs = await wishQueue.clean(WISH_QUEUE_RATE_LIMIT_DURATION, 0, 'completed');
		logToConsole('WishQueue', `Cleared ${clearedJobs.length} Jobs`);
	} catch (error) {
		logToConsole(
			'WishQueue',
			`Error clearing jobs: ${error instanceof QueueError ? error.message : 'Unknown error'}`
		);
	}
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);
