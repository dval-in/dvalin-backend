import axios from "axios";

/**
 *
 * @param authkey
 * @param gachaTypeList
 * @param latestTimeSaved date format is "YYYY-MM-DD HH:mm:ss"
 * @returns
 */
const getWishes = async (
	authkey: string,
	gachaTypeList: gachaTypeList,
	latestTimeSaved: string
): Promise<
	{
		banner: "Permanent Wish" | "Character Event Wish" | "Novice Wishes" | "Weapon Event Wish";
		history: GachaItem[];
	}[]
> => {
	const url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog";
	const wishHistory = [];
	const params = {
		authkey: authkey,
		authkey_ver: 1,
		lang: "en-us",
		page: 1,
		size: 20,
		end_id: 0,
		gacha_type: 0,
	};
	const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	for (const gachaType of gachaTypeList) {
		const bannerHistory = [];
		params.gacha_type = Number(gachaType.key);
		let currentPage = 1;
		let queryCount = 0;

		while (true) {
			params.page = currentPage;
			try {
				const response = (await axios.get(url, { params })).data as hoyoWishResponse;
				const data = response.data;
				if (data && response.retcode === 0 && data.list) {
					const gachaList = data.list;
					let foundLatestWish = false;

					for (const wish of gachaList) {
						if (wish.time > latestTimeSaved) {
							bannerHistory.push(wish);
						} else {
							foundLatestWish = true;
							break;
						}
					}
					if (foundLatestWish) {
						break;
					}
					if (gachaList.length === 0) {
						break;
					}
					currentPage++;
					queryCount++;
					if (queryCount % 5 === 0) {
						await delay(1000);
					}
				} else {
					break;
				}
			} catch (error) {
				console.error(error);
				break;
			}
		}

		wishHistory.push({ banner: gachaType.name, history: bannerHistory });
	}

	return wishHistory;
};

const getGatchaConfigList = async (authkey: string): Promise<hoyoConfigResponse> => {
	const url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getConfigList";
	const params = {
		authkey: authkey,
		lang: "en-us",
		authkey_ver: 1,
	};
	try {
		const response = await axios.get(url, { params });
		return response.data;
	} catch (error) {
		console.error(error);
		throw error;
	}
};

export { getWishes, getGatchaConfigList };

export type hoyoConfigResponse = {
	retcode: number;
	message: string;
	data: configListResponse | null;
};

export type hoyoWishResponse = {
	retcode: number;
	message: string;
	data: GachaResponse | null;
};

type configListResponse = {
	gacha_type_list: gachaTypeList;
	region: string;
};

type gachaTypeList = [
	{
		id: string;
		key: string;
		name: "Permanent Wish";
	},
	{ id: string; key: string; name: "Character Event Wish" },
	{ id: string; key: string; name: "Novice Wishes" },
	{ id: string; key: string; name: "Weapon Event Wish" }
];

type GachaItem = {
	uid: string;
	gacha_type: string;
	item_id: string;
	count: string;
	time: string; // "YYYY-MM-DD HH:mm:ss"
	name: string;
	lang: string;
	item_type: string;
	rank_type: string;
	id: string;
};

type GachaList = GachaItem[];

type GachaResponse = {
	page: string;
	size: string;
	total: string;
	list: GachaList;
	region: string;
};
