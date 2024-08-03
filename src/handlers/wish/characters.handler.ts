import { Wish } from '@prisma/client';

interface CharacterConstellation {
	key: string;
	constellation: number;
	uid: string;
}

const transformCharacterFromWishes = (
	wishes: Omit<Wish, 'createdAt'>[],
	uid: string
): CharacterConstellation[] => {
	const constellationCountMap: Map<string, number> = new Map();

	for (const wish of wishes) {
		const count = constellationCountMap.get(wish.name) || 0;
		constellationCountMap.set(wish.name, count + 1);
	}

	return Array.from(constellationCountMap, ([key, count]) => ({
		key,
		constellation: count - 1, // Subtract 1 to make first encounter 0
		uid
	}));
};

export { transformCharacterFromWishes };
