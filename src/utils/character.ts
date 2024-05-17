import { Wish } from '@prisma/client';

const transformCharacterFromWishes = (wishes: Omit<Wish, 'createdAt'>[]) => {
	const constellationCountMap: Map<string, number> = new Map();
	for (const wish of wishes) {
		if (wish.itemType === 'Character') {
			const count = (constellationCountMap.get(wish.id) || 0) + 1;
			constellationCountMap.set(wish.name, count);
		}
	}
	return Array.from(constellationCountMap, ([id, constellation]) => ({ id, constellation }));
};

export { transformCharacterFromWishes };
