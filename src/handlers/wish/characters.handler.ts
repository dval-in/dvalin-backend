import { Wish } from '@prisma/client';

interface CharacterConstellation {
	key: string;
	constellation: number;
}

const transformCharacterFromWishes = (
	wishes: Omit<Wish, 'createdAt'>[]
): CharacterConstellation[] => {
	const constellationCountMap: Map<string, number> = new Map();

	for (const wish of wishes) {
		const count = (constellationCountMap.get(wish.name) || 0) + 1;
		constellationCountMap.set(wish.name, count);
	}

	return Array.from(constellationCountMap, ([key, constellation]) => ({ key, constellation }));
};

export { transformCharacterFromWishes };
