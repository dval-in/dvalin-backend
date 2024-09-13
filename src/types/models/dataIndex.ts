interface DataItem {
	name: string;
	rarity: number;
}
export interface WeaponItem extends DataItem {
	type: string;
}

export interface CharacterItem extends DataItem {
	element: string;
	weaponType: string;
}

interface AchievementCategoryItem {
	name: string;
	order: number;
	total: number;
	achievements: AchievementItem[];
}

interface AchievementItem {
	id: number;
	name: string;
	desc: string;
	reward: number;
	hidden: boolean;
	order: number;
	version: string;
}

interface Index {
	Character: Record<string, CharacterItem>;
	Weapon: Record<string, WeaponItem>;
	AchievementCategory: Record<string, AchievementCategoryItem>;
}

export type { Index };
