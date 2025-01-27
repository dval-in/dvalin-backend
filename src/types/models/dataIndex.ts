interface DataItem {
	name: string;
}
export interface WeaponItem extends DataItem {
	rarity: number;
	type: string;
}

export interface CharacterItem extends DataItem {
	rarity: number;
	element: string;
	weaponType: string;
}

export interface AchievementItem extends DataItem {
	order: number;
	totalAchievementCount: number;
}

interface Index {
	Character: Record<string, CharacterItem>;
	Weapon: Record<string, WeaponItem>;
	AchievementCategory: Record<string, AchievementItem>;
}

export type { Index };
