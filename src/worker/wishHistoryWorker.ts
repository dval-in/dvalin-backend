import { Worker } from 'bullmq';
import { getGachaConfigList, getWishes } from '../utils/hoyolab';
import { logToConsole } from '../utils/log';
import { createGenshinAccount, getGenshinAccountsByUser } from '../db/genshinAccount';
import { WishHistoryQueueData } from '../types/queue';
import { WISH_HISTORY_QUEUE_NAME, wishHistoryQueue } from '../queues/wishHistoryQueue';
import { connection } from '../utils/queue';
import { WebSocketService } from '../services/websocket';
import { createMultipleWishes } from '../db/wishes';
import { BKTree } from '../utils/BKTree';
import { Config, Wish } from '@prisma/client';
import { transformCharacterFromWishes } from '../utils/character';
import { saveCharactersConstellation } from '../db/character';
import { getNonRefinedWeapons, saveWeaponsRefinement } from '../db/weapons';
import { transformWeaponFromWishes } from '../utils/weapons';
import { getConfigFromUid } from '../db/config';

export const setupWishHistoryWorker = (bkTree: BKTree) => {
	const wss = WebSocketService.getInstance();
	const worker = new Worker<WishHistoryQueueData, Omit<Wish, 'createdAt'>[]>(
		WISH_HISTORY_QUEUE_NAME,
		async (job) => {
			const { authkey } = job.data;
			const configResponse = await getGachaConfigList(authkey);

			if (configResponse === undefined || configResponse.data === null) {
				throw new Error('Failed to fetch gacha configuration list');
			}

			const gachaTypeList = configResponse.data.gacha_type_list;

			return await getWishes(authkey, gachaTypeList, bkTree);
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

		const genshinAccounts = await getGenshinAccountsByUser(job.data.userId);
		const uid = returnvalue[0].uid;
		let genshinAccount;

		if (genshinAccounts !== undefined) {
			const prefilter = genshinAccounts.filter((account) => account.uid === uid);

			if (prefilter.length === 0) {
				genshinAccount = await createGenshinAccount({
					uid,
					userId: job.data.userId
				});
			} else {
				genshinAccount = prefilter[0];
			}
		} else {
			genshinAccount = await createGenshinAccount({
				uid,
				userId: job.data.userId
			});
		}

		await createMultipleWishes(returnvalue);
		// in this case cannot be null
		const config = await getConfigFromUid(uid);
		const charWish = returnvalue.filter((wish) => wish.itemType === 'Character');
		const weaponWish = returnvalue.filter((wish) => wish.itemType === 'Weapon');
		const currentUnrefinedWeapons = await getNonRefinedWeapons(uid);
		const characterUpdate = transformCharacterFromWishes(charWish);
		const weaponUpdate = transformWeaponFromWishes(
			currentUnrefinedWeapons,
			weaponWish,
			config?.autoRefine3 || false,
			config?.autoRefine4 || false,
			config?.autoRefine5 || false
		);
		await saveCharactersConstellation(characterUpdate, uid);
		await saveWeaponsRefinement(weaponUpdate, uid);

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
