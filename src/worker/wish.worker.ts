import { Worker } from 'bullmq';
import { wishService } from '../services/wish.service';
import { logToConsole } from '../utils/log';
import { WishQueueData } from '../types/models/queue';
import { WISH_QUEUE_NAME, wishQueue } from '../queues/wish.queue';
import { connection } from '../config/redis.config';
import { WebSocketService } from '../services/websocket.service';
import { BKTree } from '../handlers/BKTree';
import { Wish } from '@prisma/client';

export const setupWishWorker = (bkTree: BKTree) => {
	const wss = WebSocketService.getInstance();
	const worker = new Worker<WishQueueData, Omit<Wish, 'createdAt'>[]>(
		WISH_QUEUE_NAME,
		async (job) => {
			try {
				return await wishService.processWishJob(job.data, bkTree);
			} catch (error) {
				throw new Error('Failed to fetch gacha configuration list');
			}
		},
		{ connection }
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
		console.error(err);
	});
};
