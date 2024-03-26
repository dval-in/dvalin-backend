export type HoyoConfigResponse = {
	retcode: number;
	message: string;
	data: ConfigListResponse | null;
};

export type HoyoWishResponse = {
	retcode: number;
	message: string;
	data: GachaResponse | null;
};

export type ConfigListResponse = {
	gacha_type_list: GachaTypeList;
	region: string;
};

export type GachaTypeList = GachaType[];

export type GachaType = {
	id: string;
	key: string;
	name: GachaTypeName;
};

export type GachaTypeName = "Permanent Wish" | "Character Event Wish" | "Novice Wishes" | "Weapon Event Wish";

export type GachaItem = {
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

export type GachaList = GachaItem[];

export type GachaResponse = {
	page: string;
	size: string;
	total: string;
	list: GachaList;
	region: string;
};
