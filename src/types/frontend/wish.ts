export type IWishes = {
	[key in string]?: IWish[];
};

export type IWish = {
	type: 'Weapon' | 'Character';
	number: number | undefined;
	key: string;
	date: Date;
	pity: number;
	banner: string;
	rarity: number;
	order: number;
};

export type PaimonWish = {
	type: 'Character' | 'Weapon';
	code: string;
	id: string;
	time: string;
	pity: number;
	rate?: string;
};
