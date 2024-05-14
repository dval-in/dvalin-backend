import { Queue } from 'bullmq';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { WishHistoryQueueData } from '../types/queue';
import { connection } from '../utils/queue';
import { Wish } from '@prisma/client';

export const WISH_HISTORY_QUEUE_NAME = 'wishHistory';
export const WISH_HISTORY_QUEUE_RATE_LIMIT_DURATION = 60 * 60 * 1000;

export const wishHistoryQueue = new Queue<
	WishHistoryQueueData,
	Omit<Wish, 'createdAt'>[],
	'FETCH_WISH_HISTORY'
>(WISH_HISTORY_QUEUE_NAME, {
	connection
});

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear wishhistory queue', () => {
	return wishHistoryQueue
		.clean(WISH_HISTORY_QUEUE_RATE_LIMIT_DURATION, 0, 'completed')
		.then((r) => {
			logToConsole('WishhistoryQueue', `Cleared ${r.length} Jobs`);
		});
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);
