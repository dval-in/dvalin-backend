import { Queue, Worker } from 'bullmq';
import { getGachaConfigList, getWishes } from '../utils/hoyolab';

import { config } from '../utils/envManager';
import { saveWishesInBulk } from '../db/utils';
import type { GachaItem } from '../types/wish';

const WISH_HISTORY_QUEUE_NAME = 'wishHistory';

interface WishHistoryQueueData {
	authkey: string;
	providerId: string;
}

const connection = {
	host: config.REDIS_HOSTNAME,
	port: config.REDIS_PORT,
	password: config.REDIS_PASSWORD
};

export const wishHistoryQueue = new Queue<WishHistoryQueueData, GachaItem[], 'FETCH_WISH_HISTORY'>(
	WISH_HISTORY_QUEUE_NAME,
	{
		connection
	}
);

const worker = new Worker<WishHistoryQueueData, GachaItem[]>(
	WISH_HISTORY_QUEUE_NAME,
	async (job) => {
		const { authkey, providerId } = job.data;
		const configResponse = await getGachaConfigList(authkey);

		if (configResponse.retcode !== 0 || configResponse.data === null) {
			console.error(
				'[server] Failed to fetch gacha configuration list:',
				configResponse.message
			);
			throw new Error('Failed to fetch gacha configuration list');
		}

		const gachaTypeList = configResponse.data.gacha_type_list;

		return await getWishes(authkey, gachaTypeList, providerId);
	},
	{
		connection
	}
);

worker.on('active', (job) => {
	console.log(`active:${job.id}, remaining: ${wishHistoryQueue.getWaitingCount()}`);
});

worker.on('completed', (job, returnvalue) => {
	console.log(`completed:${job.id}, remaining: ${wishHistoryQueue.getWaitingCount()}`);
	console.log('Saving to database');

	const wishesToSave = returnvalue.flatMap((wish) => {
		return {
			gachaType: wish.gacha_type,
			itemId: wish.item_id || null,
			count: wish.count,
			time: new Date(wish.time),
			name: wish.name,
			lang: wish.lang,
			itemType: wish.item_type,
			rankType: wish.rank_type,
			gachaId: wish.id,
			uid: wish.uid
		};
	});

	saveWishesInBulk(wishesToSave);
});

worker.on('failed', (job) => {
	console.log(`failed:${job?.id}, remaining: ${wishHistoryQueue.getWaitingCount()}`);
});
