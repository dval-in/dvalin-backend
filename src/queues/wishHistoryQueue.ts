import { Queue, Worker } from 'bullmq';
import { config } from '../utils/envManager';
import { GachaItem } from '../types/wish';
import { getGachaConfigList, getWishes } from '../utils/hoyolab';
import { logToConsole } from '../utils/log';
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler';
import { createMultipleWishes } from '../db/wishes';
import { createGenshinAccount, getGenshinAccountsByUser } from '../db/genshinAccount';
import { WishHistoryQueueData } from '../types/queue';

const WISH_HISTORY_QUEUE_NAME = 'wishHistory';

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

const scheduler = new ToadScheduler();

const task = new AsyncTask('clear wishhistory queue', () => {
	return wishHistoryQueue.clean(60 * 60 * 1000, 0, 'completed').then((r) => {
		logToConsole('WishhistoryQueue', `Cleared ${r.length} Jobs`);
	});
});

const job = new SimpleIntervalJob({ minutes: 5 }, task);

scheduler.addSimpleIntervalJob(job);

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

	await createMultipleWishes(wishesToSave);

	const genshinAccounts = await getGenshinAccountsByUser(job.data.userId);

	if (genshinAccounts !== undefined) {
		const uid = wishesToSave[0].uid;

		if (genshinAccounts.filter((account) => account.uid === uid).length === 0) {
			await createGenshinAccount(uid, job.data.userId);
		}
	}
});

worker.on('failed', async (job, error) => {
	logToConsole(
		'WishHistoryWorker',
		`failed: ${job?.id} (${error.message}), remaining: ${await wishHistoryQueue.getWaitingCount()}`
	);
});

worker.on('error', (err) => {
	console.error(err);
});
