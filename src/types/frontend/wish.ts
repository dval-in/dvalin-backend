export type IWishes = {
	[key in string]?: IWish[];
};

export type IWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: string;
	date: Date;
	pity: number;
	banner: string;
	rarity: number;
	bannerId: string;
	order: number;
	wasFeatured: boolean;
	gainedFiftyFifty: boolean;
};

export type PaimonWish = {
	type: 'Character' | 'Weapon';
	code: string;
	id: string;
	time: string;
	pity: number;
	rate?: string;
};
