import { getGachaConfigList, getWishes } from '../utils/hoyolab';
import { logToConsole } from '../utils/log';
import { createGenshinAccount, getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { WishQueueData } from '../types/models/queue';
import { WISH_QUEUE_RATE_LIMIT_DURATION, wishQueue } from '../queues/wish.queue';
import { WebSocketService } from './websocket.service';
import { createMultipleWishes } from '../db/models/wishes';
import { BKTree } from '../handlers/BKTree';
import { transformCharacterFromWishes } from '../handlers/wish/characters.handler';
import { saveCharactersConstellation } from '../db/models/character';
import { getNonRefinedWeapons, saveWeaponsRefinement } from '../db/models/weapons';
import { transformWeaponFromWishes } from '../handlers/wish/weapons.handler';
import { getConfigFromUid } from '../db/models/config';
import { Wish } from '@prisma/client';
import { InvalidAuthKeyError, MissingAuthKeyError, MissingUserError } from '../utils/errors';

class WishService {
	private _wss?: WebSocketService;

	private get wss(): WebSocketService {
		if (!this._wss) {
			this._wss = WebSocketService.getInstance();
		}
		return this._wss;
	}

	async checkOrCreateJob(userId: string, authkey: string | null) {
		if (!userId) {
			throw new MissingUserError();
		}

		const runningJob = await wishQueue.getJob(userId + 'wish');

		if (runningJob !== undefined) {
			return { state: 'CREATED' };
		}

		if (!authkey) {
			throw new MissingAuthKeyError();
		}

		const configResponse = await getGachaConfigList(authkey);

		if (configResponse === undefined || configResponse.data === null) {
			throw new InvalidAuthKeyError();
		}

		await wishQueue.add(
			'FETCH_WISH',
			{ authkey, userId },
			{ jobId: userId + 'wish', removeOnFail: true }
		);

		return { state: 'CREATED' };
	}

	async getJobStatus(userId: string) {
		if (!userId) {
			throw new MissingUserError();
		}

		const runningJob = await wishQueue.getJob(userId + 'wish');

		if (runningJob !== undefined) {
			const isCompleted = await runningJob.isCompleted();
			const isActive = await runningJob.isActive();
			const finishedOn = runningJob.finishedOn;

			if (isCompleted && finishedOn !== undefined) {
				return {
					state: 'COMPLETED_RATE_LIMIT',
					data: {
						completedTimestamp: finishedOn,
						rateLimitDuration: WISH_QUEUE_RATE_LIMIT_DURATION
					}
				};
			}

			if (isActive) {
				return { state: 'ACTIVE' };
			}

			const queueJobCount = await wishQueue.count();
			return { state: 'QUEUED', data: { count: queueJobCount } };
		}

		return { state: 'NO_JOB' };
	}

	async processWishJob(data: WishQueueData, bkTree: BKTree): Promise<Omit<Wish, 'createdAt'>[]> {
		const { authkey } = data;
		const configResponse = await getGachaConfigList(authkey);

		if (configResponse === undefined || configResponse.data === null) {
			throw new Error('Failed to fetch gacha configuration list');
		}

		const gachaTypeList = configResponse.data.gacha_type_list;
		return await getWishes(authkey, gachaTypeList, bkTree);
	}

	async handleCompletedJob(jobData: WishQueueData, returnvalue: Omit<Wish, 'createdAt'>[]) {
		const { userId } = jobData;

		const genshinAccounts = await getGenshinAccountsByUser(userId);
		const uid = returnvalue[0].uid;
		let genshinAccount;

		if (genshinAccounts !== undefined) {
			const prefilter = genshinAccounts.filter((account) => account.uid === uid);

			if (prefilter.length === 0) {
				genshinAccount = await createGenshinAccount({ uid, userId });
			} else {
				genshinAccount = prefilter[0];
			}
		} else {
			genshinAccount = await createGenshinAccount({ uid, userId });
		}

		await createMultipleWishes(returnvalue);

		const config = await getConfigFromUid(uid);
		const charWish = returnvalue.filter((wish) => wish.itemType === 'Character');
		const weaponWish = returnvalue.filter((wish) => wish.itemType === 'Weapon');
		const currentUnrefinedWeapons = await getNonRefinedWeapons(uid);
		const characterUpdate = transformCharacterFromWishes(charWish);
		const weaponUpdate = transformWeaponFromWishes(
			currentUnrefinedWeapons,
			weaponWish,
			config.autoRefine3,
			config.autoRefine4,
			config.autoRefine5
		);

		await saveCharactersConstellation(characterUpdate, uid);
		await saveWeaponsRefinement(weaponUpdate, uid);

		this.wss.invalidateQuery(userId, 'fetchUserProfile');
		this.wss.invalidateQuery(userId, 'fetchHoyoWishStatus');
		this.wss.sendToastMessage(userId, 'server.wish_.success', 'success');
	}

	async handleJobFailure(jobData: WishQueueData, error: Error) {
		const { userId } = jobData;
		logToConsole(
			'WishWorker',
			`failed: ${userId} (${error.message}), remaining: ${await wishQueue.getWaitingCount()}`
		);

		this.wss.invalidateQuery(userId, 'fetchHoyoWishStatus');
		this.wss.sendToastMessage(userId, 'server.wish_.error', 'error');
	}
}

export const wishService = new WishService();
