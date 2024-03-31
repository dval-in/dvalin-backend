import Queue from 'bull';
import { getWishes } from '../utils/hoyolab';
import { config } from '../utils/envManager';

const wishHistoryQueue = new Queue('wishHistory', config.REDIS_URL);

void wishHistoryQueue.process(async (job) => {
	const { authkey, providerId, uid, gachaTypeList } = job.data;
	try {
		return await getWishes(authkey, gachaTypeList, providerId, job.id.toString(), uid); // Convert job.id to a string cause ts for some obscure reason is not happy even with number
	} catch (error) {
		console.error('[server] Failed to process wish history:', error);
		throw new Error(`Failed to process wish history: ${error}`);
	}
});

const checkQueueStatus = async () => {
	const waiting = await wishHistoryQueue.getWaitingCount();
	const active = await wishHistoryQueue.getActiveCount();
	const completed = await wishHistoryQueue.getCompletedCount();
	const failed = await wishHistoryQueue.getFailedCount();
	const delayed = await wishHistoryQueue.getDelayedCount();

	console.log(`Queue Status:
    Waiting: ${waiting}
    Active: ${active}
    Completed: ${completed}
    Failed: ${failed}
    Delayed: ${delayed}`);
};

const clearQueue = async () => {
	await wishHistoryQueue.clean(0, 'completed');
	await wishHistoryQueue.clean(0, 'wait');
	await wishHistoryQueue.clean(0, 'active');
	await wishHistoryQueue.clean(0, 'delayed');
	await wishHistoryQueue.clean(0, 'failed');

	console.log('Queue cleared.');
};

export { wishHistoryQueue, checkQueueStatus, clearQueue };
