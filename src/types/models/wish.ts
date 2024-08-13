import { WishKeyBanner } from '../../types/frontend/wish';
import { Wish as PrismaWish } from '@prisma/client';

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
	gacha_type: WishKeyBanner; // banner
	count: string;
	time: string; // "YYYY-MM-DD HH:mm:ss"
	name: string;
	lang: string;
	item_type: string; // char/weapon
	rank_type: string; // rarity
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

export interface Wish extends Omit<PrismaWish, 'createdAt' | 'gachaType'> {
	gachaType: WishKeyBanner;
}

export const assertIsWish = (wish: Omit<PrismaWish, 'createdAt'>): wish is Wish => {
	return 'gachaType' in wish;
};
