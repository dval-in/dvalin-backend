import { Worker } from 'bullmq';
import { wishService } from '../services/wish.service.ts';
import { logToConsole } from '../utils/log';
import { WishQueueData } from '../types/models/queue';
import { WISH_QUEUE_NAME, wishQueue } from '../queues/wish.queue.ts';
import { connection } from '../config/redis.config.ts';
import { WebSocketService } from '../services/websocket.service.ts';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { Wish } from '@prisma/client';
import { Result, ok, err } from 'neverthrow';
import { isBannerServiceInitialised } from '../services/bannerData.ts';

const waitForInitialization = async (bkTree: BKTree) => {
	while (!bkTree.isInitialised || isBannerServiceInitialised()) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
};

export const setupWishWorker = (bkTree: BKTree) => {
	const wssResult = WebSocketService.getInstance();
	if (wssResult.isErr()) {
		logToConsole(
			'Wish.worker',
			'Failed to get WebSocketService instance:' + wssResult.error.message
		);
		return;
	}
	const wss = wssResult.value;

	const worker = new Worker<WishQueueData, Omit<Wish, 'createdAt'>[]>(
		WISH_QUEUE_NAME,
		async (job) => {
			const result = await processWishJobWithResult(job.data, bkTree);
			return result.match(
				(data) => data,
				(error) => {
					throw error;
				}
			);
		},
		{
			connection,
			autorun: false
		}
	);

	worker.on('active', async (job) => {
		logToConsole(
			'WishWorker',
			`active: ${job.id}, remaining: ${await wishQueue.getWaitingCount()}`
		);

		wss.sendToastMessage(job.data.userId, 'server.wish_.active', 'info');
		wss.invalidateQuery(job.data.userId, 'fetchHoyoWishStatus');
	});

	worker.on('completed', async (job, returnvalue) => {
		logToConsole(
			'WishWorker',
			`completed: ${job.id}, remaining: ${await wishQueue.getWaitingCount()}`
		);

		await wishService.handleCompletedJob(job.data, returnvalue);
	});

	worker.on('failed', async (job, error) => {
		if (job !== undefined) {
			wishService.handleJobFailure(job.data, error);
		}
	});

	worker.on('error', (err) => {
		logToConsole('Wish.worker', err.message);
	});

	waitForInitialization(bkTree).then(() => {
		worker.run();
	});
};

/**
 * Processes the wish job and returns a Result type.
 *
 * @param {WishQueueData} data - The wish queue data.
 * @param {BKTree} bkTree - The BKTree instance.
 * @returns {Promise<Result<Omit<Wish, 'createdAt'>[], Error>>} - The result of the operation.
 */
const processWishJobWithResult = async (
	data: WishQueueData,
	bkTree: BKTree
): Promise<Result<Omit<Wish, 'createdAt'>[], Error>> => {
	const result = await wishService.processWishJob(data, bkTree);
	if (result.isErr()) {
		return err(result.error);
	}
	return ok(result.value);
};
