interface DataItem {
	name: string;
	rarity: number;
}

interface Index {
	Character: Record<string, DataItem>;
	Weapon: Record<string, DataItem>;
}

export type { Index };
