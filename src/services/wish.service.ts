import { getGachaConfigList, getWishes } from '../utils/hoyolab';
import { logToConsole } from '../utils/log';
import { createGenshinAccount, getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { WishQueueData } from '../types/models/queue';
import { WISH_QUEUE_RATE_LIMIT_DURATION, wishQueue } from '../queues/wish.queue.ts';
import { WebSocketService } from './websocket.service.ts';
import { createMultipleWishes } from '../db/models/wishes';
import { transformCharacterFromWishes } from '../handlers/wish/characters.handler.ts';
import { saveCharactersConstellation } from '../db/models/character';
import { getNonRefinedWeapons, saveWeapons } from '../db/models/weapons';
import { transformWeaponFromWishes } from '../handlers/wish/weapons.handler.ts';
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

	async getJobStatus(userId: string): Promise<
		Result<
			{
				state: string;
				data?:
					| { completedTimestamp: number; rateLimitDuration: number }
					| { count: number };
			},
			Error
		>
	> {
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

	async processWishJob(data: WishQueueData): Promise<Result<Omit<Wish, 'createdAt'>[], Error>> {
		const { authkey } = data;
		const configResponse = await getGachaConfigList(authkey);

		if (configResponse.isErr() || configResponse.value.data === null) {
			return err(new Error('Failed to fetch gacha configuration list'));
		}
		const uidResult = await getGenshinAccountsByUser(data.userId);
		if (uidResult.isErr()) {
			return err(uidResult.error);
		}
		const uid = uidResult.value[0].uid;
		const gachaTypeList = configResponse.value.data.gacha_type_list;
		const wishesResult = await getWishes(authkey, gachaTypeList, uid);
		return wishesResult.isErr() ? err(wishesResult.error) : ok(wishesResult.value);
	}

	async handleCompletedJob(
		jobData: WishQueueData,
		returnvalue: Omit<Wish, 'createdAt'>[]
	): Promise<Result<void, Error>> {
		const { userId } = jobData;
		const uid = returnvalue[0]?.uid;

		const accountResult = await this.ensureGenshinAccount(userId, uid);
		if (accountResult.isErr()) {
			return err(accountResult.error);
		}
		const createWishesResult = await createMultipleWishes(returnvalue);
		if (createWishesResult.isErr()) {
			return err(createWishesResult.error);
		}

		const updateResult = await this.updateCharactersAndWeapons(uid, returnvalue);
		if (updateResult.isErr()) {
			return err(updateResult.error);
		}

		await this.sendWebSocketUpdates(userId);

		return ok(undefined);
	}

	private async ensureGenshinAccount(userId: string, uid: string): Promise<Result<void, Error>> {
		const genshinAccountsResult = await getGenshinAccountsByUser(userId);
		if (genshinAccountsResult.isErr()) {
			return err(genshinAccountsResult.error);
		}

		const genshinAccounts = genshinAccountsResult.value;
		if (!genshinAccounts?.some((account) => account?.uid === uid)) {
			const createResult = await createGenshinAccount({ uid, userId });
			if (createResult.isErr()) {
				return err(createResult.error);
			}
		}

		return ok(undefined);
	}

	private async updateCharactersAndWeapons(
		uid: string,
		wishes: Omit<Wish, 'createdAt'>[]
	): Promise<Result<void, Error>> {
		const configResult = await getConfigFromUid(uid);
		if (configResult.isErr()) {
			return err(configResult.error);
		}

		const config = configResult.value;
		const charWish = wishes.filter((wish) => wish.itemType === 'Character');
		const weaponWish = wishes.filter((wish) => wish.itemType === 'Weapon');

		const currentUnrefinedWeaponsResult = await getNonRefinedWeapons(uid);
		if (currentUnrefinedWeaponsResult.isErr()) {
			return err(currentUnrefinedWeaponsResult.error);
		}

		const currentUnrefinedWeapons = currentUnrefinedWeaponsResult.value;
		const characterUpdate = transformCharacterFromWishes(charWish, uid);
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

		const saveWeaponsResult = await saveWeapons(weaponUpdate);
		if (saveWeaponsResult.isErr()) {
			return err(saveWeaponsResult.error);
		}

		return ok(undefined);
	}

	private async sendWebSocketUpdates(userId: string): Promise<Result<void, Error>> {
		const wssResult = this.getWss();
		if (wssResult.isErr()) {
			return err(wssResult.error);
		}

		const wss = wssResult.value;
		wss.invalidateQuery(userId, 'fetchUserProfile');
		wss.invalidateQuery(userId, 'fetchHoyoWishStatus');
		wss.sendToastMessage(userId, 'server.wish.success', 'success');

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
			wss.sendToastMessage(userId, 'server.wish.error', 'error');
		}
	}
}

export const wishService = new WishService();
