import { getGachaConfigList, getWishes } from '../utils/hoyolab';
import { logToConsole } from '../utils/log';
import { createGenshinAccount, getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { WishQueueData } from '../types/models/queue';
import { WISH_QUEUE_RATE_LIMIT_DURATION, wishQueue } from '../queues/wish.queue';
import { WebSocketService } from './websocket.service';
import { createMultipleWishes } from '../db/models/wishes';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { transformCharacterFromWishes } from '../handlers/wish/characters.handler';
import { saveCharactersConstellation } from '../db/models/character';
import { getNonRefinedWeapons, saveWeaponsRefinement } from '../db/models/weapons';
import { transformWeaponFromWishes } from '../handlers/wish/weapons.handler';
import { getConfigFromUid } from '../db/models/config';
import { Wish } from '@prisma/client';
import { Result, ok, err } from 'neverthrow';

class WishService {
	private _wss?: Result<WebSocketService, Error>;

	private getWss(): Result<WebSocketService, Error> {
		if (!this._wss) {
			this._wss = WebSocketService.getInstance();
		}
		return this._wss;
	}

	async checkOrCreateJob(
		userId: string,
		authkey: string | null
	): Promise<Result<{ state: string }, Error>> {
		if (!userId) {
			return err(new Error('Missing user ID'));
		}

		const runningJob = await wishQueue.getJob(userId + 'wish');

		if (runningJob !== undefined) {
			return ok({ state: 'CREATED' });
		}

		if (!authkey) {
			return err(new Error('Missing auth key'));
		}

		const configResponse = await getGachaConfigList(authkey);

		if (configResponse.isErr() || configResponse.value.data === null) {
			return err(new Error('Invalid auth key'));
		}

		await wishQueue.add(
			'FETCH_WISH',
			{ authkey, userId },
			{ jobId: userId + 'wish', removeOnFail: true }
		);

		return ok({ state: 'CREATED' });
	}

	async getJobStatus(userId: string): Promise<Result<{ state: string; data?: unknown }, Error>> {
		if (!userId) {
			return err(new Error('Missing user ID'));
		}

		const runningJob = await wishQueue.getJob(userId + 'wish');

		if (runningJob !== undefined) {
			const isCompleted = await runningJob.isCompleted();
			const isActive = await runningJob.isActive();
			const finishedOn = runningJob.finishedOn;

			if (isCompleted && finishedOn !== undefined) {
				return ok({
					state: 'COMPLETED_RATE_LIMIT',
					data: {
						completedTimestamp: finishedOn,
						rateLimitDuration: WISH_QUEUE_RATE_LIMIT_DURATION
					}
				});
			}

			if (isActive) {
				return ok({ state: 'ACTIVE' });
			}

			const queueJobCount = await wishQueue.count();
			return ok({ state: 'QUEUED', data: { count: queueJobCount } });
		}

		return ok({ state: 'NO_JOB' });
	}

	async processWishJob(
		data: WishQueueData,
		bkTree: BKTree
	): Promise<Result<Omit<Wish, 'createdAt'>[], Error>> {
		const { authkey } = data;
		const configResponse = await getGachaConfigList(authkey);

		if (configResponse.isErr() || configResponse.value.data === null) {
			return err(new Error('Failed to fetch gacha configuration list'));
		}

		const gachaTypeList = configResponse.value.data.gacha_type_list;
		const wishesResult = await getWishes(authkey, gachaTypeList, bkTree);

		return wishesResult.isErr() ? err(wishesResult.error) : ok(wishesResult.value);
	}

	async handleCompletedJob(
		jobData: WishQueueData,
		returnvalue: Omit<Wish, 'createdAt'>[]
	): Promise<Result<void, Error>> {
		const { userId } = jobData;

		const genshinAccountsResult = await getGenshinAccountsByUser(userId);
		if (genshinAccountsResult.isErr()) {
			return err(genshinAccountsResult.error);
		}

		const genshinAccounts = genshinAccountsResult.value;
		const uid = returnvalue[0].uid;
		let genshinAccount;

		if (genshinAccounts !== undefined) {
			const prefilter = genshinAccounts.filter((account) => account.uid === uid);

			if (prefilter.length === 0) {
				const createResult = await createGenshinAccount({ uid, userId });
				if (createResult.isErr()) {
					return err(createResult.error);
				}
				genshinAccount = createResult.value;
			} else {
				genshinAccount = prefilter[0];
			}
		} else {
			const createResult = await createGenshinAccount({ uid, userId });
			if (createResult.isErr()) {
				return err(createResult.error);
			}
			genshinAccount = createResult.value;
		}

		const createWishesResult = await createMultipleWishes(returnvalue);
		if (createWishesResult.isErr()) {
			return err(createWishesResult.error);
		}

		const configResult = await getConfigFromUid(uid);
		if (configResult.isErr()) {
			return err(configResult.error);
		}

		const config = configResult.value;
		const charWish = returnvalue.filter((wish) => wish.itemType === 'Character');
		const weaponWish = returnvalue.filter((wish) => wish.itemType === 'Weapon');
		const currentUnrefinedWeaponsResult = await getNonRefinedWeapons(uid);
		if (currentUnrefinedWeaponsResult.isErr()) {
			return err(currentUnrefinedWeaponsResult.error);
		}

		const currentUnrefinedWeapons = currentUnrefinedWeaponsResult.value;
		const characterUpdate = transformCharacterFromWishes(charWish);
		const weaponUpdate = transformWeaponFromWishes(
			currentUnrefinedWeapons,
			weaponWish,
			config.autoRefine3,
			config.autoRefine4,
			config.autoRefine5
		);

		const saveCharactersResult = await saveCharactersConstellation(characterUpdate, uid);
		if (saveCharactersResult.isErr()) {
			return err(saveCharactersResult.error);
		}

		const saveWeaponsResult = await saveWeaponsRefinement(weaponUpdate, uid);
		if (saveWeaponsResult.isErr()) {
			return err(saveWeaponsResult.error);
		}

		const wssResult = this.getWss();
		if (wssResult.isErr()) {
			return err(wssResult.error);
		}

		const wss = wssResult.value;
		wss.invalidateQuery(userId, 'fetchUserProfile');
		wss.invalidateQuery(userId, 'fetchHoyoWishStatus');
		wss.sendToastMessage(userId, 'server.wish_.success', 'success');

		return ok(undefined);
	}

	async handleJobFailure(jobData: WishQueueData, error: Error): Promise<void> {
		const { userId } = jobData;
		logToConsole(
			'WishWorker',
			`failed: ${userId} (${error.message}), remaining: ${await wishQueue.getWaitingCount()}`
		);

		const wssResult = this.getWss();
		if (wssResult.isOk()) {
			const wss = wssResult.value;
			wss.invalidateQuery(userId, 'fetchHoyoWishStatus');
			wss.sendToastMessage(userId, 'server.wish_.error', 'error');
		}
	}
}

export const wishService = new WishService();
