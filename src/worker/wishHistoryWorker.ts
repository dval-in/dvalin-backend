import { Worker } from 'bullmq';
import { GachaItem } from '../types/wish';
import { getGachaConfigList, getWishes } from '../utils/hoyolab';
import { logToConsole } from '../utils/log';
import { createGenshinAccount, getGenshinAccountsByUser } from '../db/genshinAccount';
import { WishHistoryQueueData } from '../types/queue';
import { WISH_HISTORY_QUEUE_NAME, wishHistoryQueue } from '../queues/wishHistoryQueue';
import { connection } from '../utils/queue';
import { WebSocketService } from '../services/websocket';

export const setupWishHistoryWorker = () => {
	const wss = WebSocketService.getInstance();

	const worker = new Worker<WishHistoryQueueData, GachaItem[]>(
		WISH_HISTORY_QUEUE_NAME,
		async (job) => {
			const { authkey } = job.data;
			const configResponse = await getGachaConfigList(authkey);

			if (configResponse === undefined || configResponse.data === null) {
				throw new Error('Failed to fetch gacha configuration list');
			}

			const gachaTypeList = configResponse.data.gacha_type_list;

			return await getWishes(authkey, gachaTypeList);
		},
		{
			connection
		}
	);

	worker.on('active', async (job) => {
		logToConsole(
			'WishHistoryWorker',
			`active: ${job.id}, remaining: ${await wishHistoryQueue.getWaitingCount()}`
		);

		wss.sendToastMessage(job.data.userId, 'server.wish_history.active', 'info');
		wss.invalidateQuery(job.data.userId, 'fetchHoyoWishhistoryStatus');
	});

	worker.on('completed', async (job, returnvalue) => {
		logToConsole(
			'WishHistoryWorker',
			`completed: ${job.id}, remaining: ${await wishHistoryQueue.getWaitingCount()}`
		);

		const wishesToSave = returnvalue.flatMap((wish) => ({
			gachaType: wish.gacha_type,
			itemId: wish.item_id || null,
			time: new Date(wish.time),
			name: wish.name,
			itemType: wish.item_type,
			rankType: wish.rank_type,
			gachaId: wish.id,
			uid: wish.uid
		}));

		const genshinAccounts = await getGenshinAccountsByUser(job.data.userId);

		if (genshinAccounts !== undefined) {
			const uid = wishesToSave[0].uid;

			if (genshinAccounts.filter((account) => account.uid === uid).length === 0) {
				await createGenshinAccount(uid, job.data.userId);
			}
		}

		wss.invalidateQuery(job.data.userId, 'fetchUserProfile');
		wss.invalidateQuery(job.data.userId, 'fetchHoyoWishhistoryStatus');
		wss.sendToastMessage(job.data.userId, 'server.wish_history.success', 'success');
	});

	worker.on('failed', async (job, error) => {
		if (job !== undefined) {
			logToConsole(
				'WishHistoryWorker',
				`failed: ${job.id} (${error.message}), remaining: ${await wishHistoryQueue.getWaitingCount()}`
			);

			wss.invalidateQuery(job.data.userId, 'fetchHoyoWishhistoryStatus');
			wss.sendToastMessage(job.data.userId, 'server.wish_history.error', 'error');
		}
	});

	worker.on('error', (err) => {
		console.error(err);
	});
};
