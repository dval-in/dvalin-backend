import { Weapon, Wish } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const transformWeaponFromWishes = (
	currentUnrefinedWeapon: Weapon[],
	wishes: Omit<Wish, 'createdAt'>[],
	autoRefine3: boolean,
	autoRefine4: boolean,
	autoRefine5: boolean
): Weapon[] => {
	if (!autoRefine3 && !autoRefine4 && !autoRefine5) {
		return currentUnrefinedWeapon;
	}

	const finalWeapons: Weapon[] = [];
	wishes.forEach((wish) => {
		if (
			(wish.rankType === '3' && autoRefine3) ||
			(wish.rankType === '4' && autoRefine4) ||
			(wish.rankType === '5' && autoRefine5)
		) {
			const unrefinedWeaponExist = currentUnrefinedWeapon.find(
				(weapon) => wish.name === weapon.key
			);
			if (unrefinedWeaponExist) {
				unrefinedWeaponExist.refinement += 1;
				if (unrefinedWeaponExist.refinement === 5) {
					currentUnrefinedWeapon = currentUnrefinedWeapon.filter(
						(weapon) => weapon.id !== unrefinedWeaponExist.id
					);
					finalWeapons.push(unrefinedWeaponExist);
				}
			} else {
				currentUnrefinedWeapon.push({
					id: randomUUID(),
					uid: wish.uid,
					key: wish.name,
					refinement: 1,
					level: 1,
					ascension: 1,
					characterKey: null
				});
			}
		}
	});
	finalWeapons.push(...currentUnrefinedWeapon);
	return finalWeapons;
};

export { transformWeaponFromWishes };
