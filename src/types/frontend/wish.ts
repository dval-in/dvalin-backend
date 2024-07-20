export type IWishes = {
	[key in string]?: IWish[];
};

export type IMappedWishes = {
	[key in string]?: IMappedWish[];
};

export type IWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: string;
	date: Date;
	pity: number;
	banner: string;
	rarity: number;
};

export type IMappedWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: string;
	date: Date;
	pity: number;
	banner: string;
	name: string;
	rarity: number;
};

export type PaimonWish = {
	type: 'Character' | 'Weapon';
	code: string;
	id: string;
	time: string;
	pity: number;
	rate?: string;
};
