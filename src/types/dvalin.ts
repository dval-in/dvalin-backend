export interface UserProfile {
	format: 'dvalin';
	version: number;
	user?: IUser;
	achievements?: IAchievementCategory;
	artifacts?: IArtifact[];
	characters?: ICharacters;
	furnishing?: IFurnishings;
	materials?: IMaterials;
	weapons?: IWeapon[];
	wishes?: IWishes;
}

export const isDvalinUserProfile = (object: unknown): object is UserProfile => {
	if (typeof object === 'object' && object !== null) {
		if ('format' in object) {
			if (object.format === 'dvalin') {
				return true;
			}
		}
	}
	return false;
};
export type IArtifact = {
	setKey: string;
	slotKey: string;
	level: number;
	rarity: number;
	mainStatKey: string;
	location: string | '';
	lock: boolean;
	substats: ISubstat[];
};

export type ISubstat = {
	key: string;
	value: number;
};

export type ICharacters = {
	[key in string]: ICharacter;
};

export type ICharacter = {
	level: number;
	constellation: number;
	ascension: number;
	talent: {
		auto: number;
		skill: number;
		burst: number;
	};
};

export type IFurnishings = {
	[key in string]?: number;
};

export type IMaterials = {
	[key in string]?: number;
};

export type WeaponTypes = 'bow' | 'catalyst' | 'claymore' | 'polearm' | 'sword';

export type IWeapon = {
	key: string;
	level: number;
	ascension: number;
	refinement: number;
	location: string | '';
	lock: boolean;
};

export type IAchievementCategory = {
	[key in string]: IAchievements;
};

export type IAchievements = {
	[key in number]: IAchievement;
};

export type IAchievement = {
	category: string;
	achieved: boolean;
	preStage?: string;
};

export interface IUser {
	server?: ServerKey;
	ar: number;
	uid?: number;
	wl: number;
}

const serverKeys = ['Europe', 'America', 'Asia', 'HK-TW', 'China'];

export type ServerKey = (typeof serverKeys)[number];

export const isServerKey = (key: string): key is ServerKey => {
	return serverKeys.includes(key);
};

export type IWishes = {
	[key in string]?: IMappedWish[];
};

export type IMappedWishes = {
	[key in string]?: IMappedWish[];
};

export type IWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: string | string;
	date: Date;
	pity: number;
	banner: string;
};

export type IMappedWish = {
	type: 'Weapon' | 'Character';
	number: number;
	key: string | string;
	date: Date;
	pity: number;
	banner: string;
	name: string;
	rarity: number;
};
