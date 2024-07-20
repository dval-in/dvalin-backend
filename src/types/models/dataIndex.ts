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

interface Index {
	Character: Record<string, CharacterItem>;
	Weapon: Record<string, WeaponItem>;
}

export type { Index };
