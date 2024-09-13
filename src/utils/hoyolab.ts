import axios from 'axios';
import {
	GachaItem,
	GachaType,
	GachaTypeList,
	HoyoConfigResponse,
	Wish
} from '../types/models/wish';
import { logToConsole } from './log';
import {
	getLatest4StarWishByUid,
	getLatest5StarWishByUid,
	getLatestWishByUidAndGachaType
} from '../db/models/wishes';
import { err, ok, Result } from 'neverthrow';
import { ServerKey } from '../types/frontend/user';
import { fetchWishes, processWish } from '../handlers/wish/wish.handler.ts';
import { randomDelay } from './time.ts';
import temporaryBannerCode from '../config/constant.ts';
import { dataService } from '../services/data.service.ts';

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
	uid: string
): Promise<Result<Wish[], Error>> => {
	try {
		const wishHistory = await fetchAllWishes(authkey, gachaTypeList, uid);
		return ok(wishHistory);
	} catch (error) {
		return err(new Error(`Failed to fetch wishes: ${error.message}`));
	}
};

const fetchAllWishes = async (
	authkey: string,
	gachaTypeList: GachaTypeList,
	uid: string
): Promise<Wish[]> => {
	const wishHistory: Wish[] = [];

	for (const gachaType of gachaTypeList) {
		await fetchWishesForGachaType(authkey, gachaType, wishHistory, uid);
	}

	return wishHistory;
};

const fetchWishesForGachaType = async (
	authkey: string,
	gachaType: GachaType,
	wishHistory: Wish[],
	uid: string
) => {
	let lastNewWishId = '0';
	let hasMore = true;
	const wishArray: Wish[] = [];
	const latestSavedWishResult = await getLatestWishByUidAndGachaType(uid, gachaType.key);
	if (latestSavedWishResult.isErr()) {
		throw new Error('Failed to retrieve latest saved wish');
	}
	const latestSavedWish = latestSavedWishResult.value;

	while (hasMore) {
		const wishesResult = await fetchWishes(authkey, gachaType.key, lastNewWishId);
		if (wishesResult.isErr()) {
			throw new Error(wishesResult.error);
		}

		const wishes = wishesResult.value;
		hasMore = processWishes(wishes, latestSavedWish, wishArray);
		lastNewWishId = wishes[wishes.length - 1]?.id || lastNewWishId;

		if (wishes.length < 20) {
			hasMore = false;
		}

		await randomDelay(200, 1000);
	}
	let order = latestSavedWish?.order ?? 0;
	let fiveStarPity = 0;
	let fourStarPity = 0;
	let prev5StarIsFeatured = false;
	let prev4StarIsFeatured = false;
	if (wishArray.length === 0) {
		return;
	}
	const latestSaved5Star = await getLatest5StarWishByUid(uid, wishArray[0].gachaType);
	if (latestSaved5Star.isOk()) {
		const fiveStarOrder = latestSaved5Star.value?.order ?? 0;
		prev5StarIsFeatured = latestSaved5Star.value?.isFeatured; // NOSONAR: false positive
		fiveStarPity = order - fiveStarOrder;
	}

	const latestSaved4Star = await getLatest4StarWishByUid(uid, wishArray[0].gachaType);
	if (latestSaved4Star.isOk()) {
		const fourStarOrder = latestSaved4Star.value?.order ?? 0;
		prev4StarIsFeatured = latestSaved4Star.value?.isFeatured; //NOSONAR: false positive
		fourStarPity = order - fourStarOrder;
	}

	for (const wish of wishArray.toReversed()) {
		order++;
		fiveStarPity++;
		fourStarPity++;

		wish.order = order;

		if (wish.rankType === '5') {
			wish.pity = fiveStarPity.toString();
			fiveStarPity = 0;
			wish.wonFiftyFifty =
				temporaryBannerCode.includes(wish.gachaType) &&
				wish.isFeatured &&
				prev5StarIsFeatured;
			prev5StarIsFeatured = wish.isFeatured;
		} else if (wish.rankType === '4') {
			wish.pity = fourStarPity.toString();
			fourStarPity = 0;
			wish.wonFiftyFifty =
				temporaryBannerCode.includes(wish.gachaType) &&
				wish.isFeatured &&
				prev4StarIsFeatured;
			prev4StarIsFeatured = wish.isFeatured;
		} else {
			wish.pity = '0';
		}
	}
	wishHistory.push(...wishArray);
};

const processWishes = (
	wishes: GachaItem[],
	latestSavedWish: Wish | null,
	wishHistory: Wish[]
): boolean => {
	const bkTree = dataService.getBKTree();
	if (!latestSavedWish) {
		for (const wish of wishes) {
			wishHistory.push(processWish(wish, bkTree, 0));
		}
		return true;
	}

	for (const wish of wishes) {
		if (
			latestSavedWish.genshinWishId === wish.id ||
			(wish.gacha_type === latestSavedWish.gachaType &&
				compareGachaItemDate(wish, latestSavedWish.time) === 0 &&
				bkTree.search(wish.name)[0].word === latestSavedWish.name) ||
			compareGachaItemDate(wish, latestSavedWish.time) <= 0
		) {
			return false;
		}
		wishHistory.push(processWish(wish, bkTree, 0));
	}
	return true;
};

/**
 * Fetches the Gacha configuration list.
 *
 * @param authkey Authentication key for the API.
 * @returns The Gacha configuration list result.
 */
const getGachaConfigList = async (authkey: string): Promise<Result<HoyoConfigResponse, Error>> => {
	const url = 'https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getConfigList';

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

/**
 * Compares the date of a Gacha item with a given date.
 * - Negative: item's date is earlier
 * - Zero: dates are the same (to the second)
 * - Positive: item's date is later
 *
 * @param item Gacha item to compare.
 * @param compareDate Date to compare with.
 * @returns The difference in seconds between the two dates.
 * */
function compareGachaItemDate(item: GachaItem, compareDate: Date): number {
	const itemDate = new Date(item.time + 'Z');
	return Math.floor(itemDate.getTime() / 1000) - Math.floor(compareDate.getTime() / 1000);
}

export { getWishes, getGachaConfigList, serverTimeToUTC, getServer };
