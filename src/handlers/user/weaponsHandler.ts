import { randomUUID } from 'crypto';
import { getWeaponsByUid, saveWeapon } from '../../db/weapons';
import { UserProfile } from '../../types/dvalin/dvalinFile';

export const handleWeapons = async (userProfile: UserProfile & { userId: string }, uid: string) => {
	if (!userProfile.weapons) return;

	const transformedWeapons = Object.entries(userProfile.weapons).map(([key, weapon]) => ({
		id: weapon.id || randomUUID(),
		key,
		refinement: weapon.refinement || 1,
		level: weapon.level || 1,
		ascension: weapon.ascension || 1,
		characterKey: weapon.characterKey || null
	}));

	const currentWeapons = await getWeaponsByUid(uid);
	const filteredWeapons = currentWeapons
		? transformedWeapons.filter((weapon) => !currentWeapons.some((c) => c.id === weapon.id))
		: transformedWeapons;

	for (const weapon of filteredWeapons) {
		await saveWeapon({ ...weapon, uid });
	}
};
