import { Weapon, Wish } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const transformWeaponFromWishes = (
	currentUnrefinedWeapon: Weapon[],
	wishes: Omit<Wish, 'createdAt'>[],
	autoRefine3: boolean,
	autoRefine4: boolean,
	autoRefine5: boolean
): Weapon[] => {
	const weapons = [...currentUnrefinedWeapon];

	wishes.forEach((wish) => {
		const shouldAutoRefine =
			(wish.rankType === '3' && autoRefine3) ||
			(wish.rankType === '4' && autoRefine4) ||
			(wish.rankType === '5' && autoRefine5);

		if (shouldAutoRefine) {
			// Try to find a weapon to refine
			const weaponToRefine = weapons.find((w) => w.key === wish.name && w.refinement < 5);
			if (weaponToRefine) {
				weaponToRefine.refinement += 1;
			} else {
				// If no refinable weapon found or all are at max refinement, create a new one
				weapons.push(createNewWeapon(wish));
			}
		} else {
			// Always create a new weapon if not auto-refining
			weapons.push(createNewWeapon(wish));
		}
	});

	return weapons;
};

const createNewWeapon = (wish: Omit<Wish, 'createdAt'>): Weapon => ({
	id: randomUUID(),
	uid: wish.uid,
	key: wish.name,
	refinement: 1,
	level: 1,
	ascension: 1,
	characterKey: null
});

export { transformWeaponFromWishes };
