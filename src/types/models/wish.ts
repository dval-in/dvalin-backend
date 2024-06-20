export interface HoyoConfigResponse {
	retcode: number;
	message: string;
	data: ConfigListResponse | null;
}

export interface HoyoWishResponse {
	retcode: number;
	message: string;
	data: GachaResponse | null;
}

export interface ConfigListResponse {
	gacha_type_list: GachaTypeList;
	region: string;
}

export type GachaTypeList = GachaType[];

export interface GachaType {
	id: string;
	key: string;
	name: GachaTypeName;
}

export type GachaTypeName =
	| 'Permanent Wish'
	| 'Character Event Wish'
	| 'Novice Wishes'
	| 'Weapon Event Wish'
	| 'Chronicled Wish';

export interface GachaItem {
	uid: string;
	gacha_type: string;
	count: string;
	time: string; // "YYYY-MM-DD HH:mm:ss"
	name: string;
	lang: string;
	item_type: string;
	rank_type: string;
	id: string;
}

export type GachaList = GachaItem[];

export interface GachaResponse {
	page: string;
	size: string;
	total: string;
	list: GachaList;
	region: string;
}
