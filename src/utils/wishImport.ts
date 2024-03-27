import axios from "axios";
import { GachaItem, HoyoConfigResponse, GachaTypeList, HoyoWishResponse, GachaTypeName } from "../types/wish";

/**
 * Fetches wish history from the Genshin Impact API.
 *
 * @param authkey Authentication key for the API.
 * @param gachaTypeList List of gacha types to query.
 * @param latestTimeSaved The latest saved wish time in "YYYY-MM-DD HH:mm:ss" format.
 * @returns A Promise with the wish history.
 */
async function getWishes(
	authkey: string,
	gachaTypeList: GachaTypeList,
	latestTimeSaved: string
): Promise<
	{
		banner: "Permanent Wish" | "Character Event Wish" | "Novice Wishes" | "Weapon Event Wish";
		history: GachaItem[];
	}[]
> {
	const url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog";
	const wishHistory: Array<{ banner: GachaTypeName; history: GachaItem[] }> = [];

	for (const gachaType of gachaTypeList) {
		let currentPage = 1;
		let endId = 0;
		let hasMore = true;
		const bannerHistory: GachaItem[] = [];

		while (hasMore) {
			try {
				const response = await axios.get<HoyoWishResponse>(url, {
					params: {
						authkey: authkey,
						authkey_ver: 1,
						lang: "en-us",
						page: currentPage,
						size: 20,
						end_id: endId,
						gacha_type: gachaType.key,
					},
				});

				const { data } = response;
				if (data.retcode === 0 && data.data && data.data.list.length > 0) {
					for (const wish of data.data.list) {
						if (wish.time > latestTimeSaved) {
							bannerHistory.push(wish);
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
			} catch (error) {
				console.error("Failed to fetch gacha history:", error);
				break;
			}
		}
		wishHistory.push({ banner: gachaType.name, history: bannerHistory });
	}

	return wishHistory;
}

/**
 * Fetches the Gacha configuration list.
 *
 * @param authkey Authentication key for the API.
 * @returns The Gacha configuration list.
 */
async function getGachaConfigList(authkey: string): Promise<HoyoConfigResponse> {
	const url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getConfigList";

	try {
		const response = await axios.get<HoyoConfigResponse>(url, {
			params: {
				authkey: authkey,
				lang: "en-us",
				authkey_ver: 1,
			},
		});

		return response.data;
	} catch (error) {
		console.error("Failed to fetch gacha configuration list:", error);
		throw error;
	}
}

/**
 * Generates a random delay between min and max milliseconds.
 *
 * @param min Minimum delay in milliseconds.
 * @param max Maximum delay in milliseconds.
 */
const randomDelay = (min: number, max: number) => {
	const duration = Math.floor(Math.random() * (max - min + 1) + min);
	return new Promise((resolve) => setTimeout(resolve, duration));
};

export { getWishes, getGachaConfigList };
