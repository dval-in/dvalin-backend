export type WeaponTypes = 'bow' | 'catalyst' | 'claymore' | 'polearm' | 'sword';

type IWeapon = {
	id: string; // "CrescentPike"
	key: string; // "CrescentPike"
	level: number; // 1-90 inclusive
	ascension: number; // 0-6 inclusive. need to disambiguate 80/90 or 80/80
	refinement: number; // 1-5 inclusive
	characterKey?: string;
};

export type IWeapons = {
	[key in string]: IWeapon; // "CrescentPike": { ... }
};
