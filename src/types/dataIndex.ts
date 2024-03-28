interface DataItem {
	name: string;
	icon: string;
	rarity: number;
}

interface Index {
	Character: { [key: string]: DataItem };
	Weapon: { [key: string]: DataItem };
}

export { Index };
