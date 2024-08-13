export type IWishes = {
	[key in string]?: IWish[];
};

export type IWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: string;
	date: Date;
	pity: number;
	banner: WishKeyBanner;
	rarity: number;
	bannerId: string;
	order: number;
	isFeatured: boolean;
	wonFiftyFifty: boolean;
};

export type PaimonWish = {
	type: 'Character' | 'Weapon';
	code: WishKeyBanner;
	id: string;
	time: string;
	pity: number;
	rate?: string;
};

export type WishKeyBanner = '100' | '200' | '301' | '302' | '400' | '500';
