import axios from 'axios';
import {
	type GachaItem,
	type GachaTypeList,
	type HoyoConfigResponse,
	type HoyoWishResponse
} from '../types/wish';
import { getLatestWishFromGenshinAccount, linkGenshinAccountToUser } from '../db/utils';


// last updated 3/04/2024
/**
 * converts a time returned by server into utc time:
 * 
 * @param uid genshin uid
 * @param date the time that should be converted into utc
 * @returns utc taime
 */
const serverTimeToUTC = (
	uid: string,
	date: string,
): Date => {
	const prefix = uid.length === 9 ? uid.substring(0, 1) : uid.substring(0, 2);
	// convert to utc date, or js will take in as local
	let utcDate = new Date(date + 'Z');
	switch (prefix) {
		// mainland china
		// utc + 8
		case "1":
		case "2":
		case "3":
		case "5":
		// TW, HK, MO china aswell
		case "9":
		// asia also follows china
		case "8":
		case "18":
			utcDate.setHours(utcDate.getHours() - 8);
			break;

		// america utc -5
		case "6":
			utcDate.setHours(utcDate.getHours() + 5);
			break;

		// europe utc + 1
		case "7":
			utcDate.setHours(utcDate.getHours() - 1);
			break;

		default:
			console.error(`Unhandled UID prefix {${prefix}} for {${date}}`);
			break;
	}
	return utcDate;
}

/**
 * Fetches wish history from the Genshin Impact API.
 *
 * @param authkey Authentication key for the API.
 * @param gachaTypeList List of gacha types to query.
 * @param providerId
 * @param uid
 * @returns A Promise with the wish history.
 */
const getWishes = async (
	authkey: string,
	gachaTypeList: GachaTypeList,
	providerId: string,
	uid?: string
): Promise<GachaItem[]> => {
	const url = 'https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog';
	const wishHistory: GachaItem[] = [];
	let latestTimeSaved = '2020-09-28T00:00:00.000Z';

	if (uid) {
		const latestWish = await getLatestWishFromGenshinAccount(uid);

		if (latestWish) {
			latestTimeSaved = latestWish.time.toISOString();
		}
	}

	for (const gachaType of gachaTypeList) {
		let currentPage = 1;
		const endId = 0;
		let hasMore = true;

		while (hasMore) {
			const response = await axios.get<HoyoWishResponse>(url, {
				params: {
					authkey,
					authkey_ver: 1,
					lang: 'en-us',
					page: currentPage,
					size: 20,
					end_id: endId,
					gacha_type: gachaType.key
				}
			});

			const { data } = response;
			if (data.retcode === 0 && data.data !== null && data.data.list.length > 0) {
				for (const wish of data.data.list) {
					if (wish.time > latestTimeSaved) {
						wishHistory.push(wish);
					} else {
						hasMore = false;
						break;
					}
				}
				currentPage++;
				if (currentPage % 5 === 0) await randomDelay(100, 1000);
			} else {
				hasMore = false;
			}
		}
	}

	if (!uid) {
		await linkGenshinAccountToUser(providerId, wishHistory[0].uid);
	}

	return wishHistory;
};

/**
 * Fetches the Gacha configuration list.
 *
 * @param authkey Authentication key for the API.
 * @returns The Gacha configuration list.
 */
const getGachaConfigList = async (authkey: string): Promise<HoyoConfigResponse> => {
	const url = 'https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getConfigList';

	try {
		const response = await axios.get<HoyoConfigResponse>(url, {
			params: {
				authkey,
				lang: 'en-us',
				authkey_ver: 1
			}
		});

		return response.data;
	} catch (error) {
		console.error('Failed to fetch gacha configuration list:', error);
		throw error;
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

export { getWishes, getGachaConfigList };
