import axios from 'axios';
import { GachaTypeList, HoyoConfigResponse } from '../types/models/wish';
import { logToConsole } from './log';
import { getLatestWishByUid } from '../db/models/wishes';
import { Wish } from '@prisma/client';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { err, ok, Result } from 'neverthrow';
import { ServerKey } from '../types/frontend/user';
import { fetchWishes, processWish } from '../handlers/wish/wish.handler';

/**
 * Converts a time returned by server into UTC time.
 *
 * @param uid Genshin UID.
 * @param date The time that should be converted into UTC.
 * @returns UTC time.
 */
const serverTimeToUTC = (uid: string, date: string): Date => {
	const prefix = uid.length === 9 ? uid.substring(0, 1) : uid.substring(0, 2);
	// convert to utc date, or js will take in as local
	const utcDate = new Date(date + 'Z');
	switch (prefix) {
		// mainland china
		// utc + 8
		case '1':
		case '2':
		case '3':
		case '5':
		// TW, HK, MO china aswell
		case '9':
		// asia also follows china
		case '8':
		case '18':
			utcDate.setHours(utcDate.getHours() - 8);
			break;

		// america utc -5
		case '6':
			utcDate.setHours(utcDate.getHours() + 5);
			break;

		// europe utc + 1
		case '7':
			utcDate.setHours(utcDate.getHours() - 1);
			break;

		default:
			logToConsole('Hoyolab.utils', `Unhandled UID prefix {${prefix}} for {${date}}`);
			break;
	}
	return utcDate;
};

/**
 * Fetches wish history from the Genshin Impact API.
 *
 * @param authkey Authentication key for the API.
 * @param gachaTypeList List of gacha types to query.
 * @param bkTree BKTree instance.
 * @param uid Optional UID.
 * @returns A Promise with the result containing the wish history or an error message.
 */

const getWishes = async (
	authkey: string,
	gachaTypeList: GachaTypeList,
	bkTree: BKTree,
	uid: string
): Promise<Result<Omit<Wish, 'createdAt'>[], Error>> => {
	let latestSavedWishId = '0';

	const latestSavedWishResult = await getLatestWishByUid(uid);
	if (latestSavedWishResult.isErr()) {
		return err(new Error('Failed to retrieve latest saved wish'));
	}
	latestSavedWishId = latestSavedWishResult.value?.id || '0';

	const wishHistory: Omit<Wish, 'createdAt'>[] = [];

	for (const gachaType of gachaTypeList) {
		let lastNewWishId = '0';
		let hasMore = true;
		const pityCounter = { fourStar: 0, fiveStar: 0 };

		while (hasMore) {
			const wishesResult = await fetchWishes(authkey, gachaType.key, lastNewWishId);

			if (wishesResult.isErr()) {
				return err(new Error(wishesResult.error));
			}
			const wishes = wishesResult.value;

			for (const wish of wishes) {
				if (wish.id <= latestSavedWishId) {
					hasMore = false;
					break;
				}

				wishHistory.push(processWish(wish, bkTree, pityCounter));
				lastNewWishId = wish.id;
			}
			if (wishes.length < 20) {
				hasMore = false;
			}

			await randomDelay(100, 1000);
		}
	}

	return ok(wishHistory);
};

/**
 * Fetches the Gacha configuration list.
 *
 * @param authkey Authentication key for the API.
 * @returns The Gacha configuration list result.
 */
const getGachaConfigList = async (authkey: string): Promise<Result<HoyoConfigResponse, Error>> => {
	const url = 'https://hk4e-api-os.mihoyo.com/gacha_info/api/getConfigList';

	try {
		const response = await axios.get<HoyoConfigResponse>(url, {
			params: {
				authkey,
				lang: 'en-us',
				authkey_ver: 1
			}
		});

		if (response.status !== 200) {
			return err(new Error('Failed to fetch config list'));
		}

		response.data.data?.gacha_type_list.push({
			id: '99999',
			key: '500',
			name: 'Chronicled Wish'
		});

		return ok(response.data);
	} catch (error) {
		logToConsole('Utils', `getGachaConfigList failed for ${authkey}`);
		return err(new Error('Failed to fetch config list'));
	}
};

/**
 * Generates a random delay between min and max milliseconds.
 *
 * @param min Minimum delay in milliseconds.
 * @param max Maximum delay in milliseconds.
 */
const randomDelay = async (min: number, max: number): Promise<void> => {
	const duration = Math.floor(Math.random() * (max - min + 1) + min);
	await new Promise((resolve) => setTimeout(resolve, duration));
};

const getServer = (uid: string): ServerKey => {
	const prefix = uid.length === 9 ? uid.substring(0, 1) : uid.substring(0, 2);
	switch (prefix) {
		case '1':
		case '2':
		case '3':
		case '5':
			return 'China';
		case '9':
			return 'HK-TW';
		case '8':
		case '18':
			return 'Asia';
		case '6':
			return 'America';
		case '7':
			return 'Europe';
		default:
			logToConsole('Hoyolab.utils', `Unhandled UID prefix {${prefix}}`);
			return 'Europe';
	}
};

export { getWishes, getGachaConfigList, serverTimeToUTC, getServer };
