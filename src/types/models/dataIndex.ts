interface DataItem {
	name: string;
	rarity: number;
}
interface WeaponItem extends DataItem {
	type: string;
}

interface CharacterItem extends DataItem {
	element: string;
	weaponType: string;
}

interface AchievementCategoryItem {
	name: string;
	order: number;
	total: number;
}

interface Index {
	Character: Record<string, CharacterItem>;
	Weapon: Record<string, WeaponItem>;
	AchievementCategory: Record<string, AchievementCategoryItem>;
}

export type { Index };
