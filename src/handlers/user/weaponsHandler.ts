import { getWeaponsByUid, saveWeapon } from '../../db/weapons';
import { UserProfile } from '../../types/dvalin/dvalinFile';

export const handleWeapons = async (userProfile: UserProfile & { userId: string }, uid: string) => {
	if (!userProfile.weapons) return;

	const transformedWeapons = Object.entries(userProfile.weapons).map(([key, weapon]) => ({
		id: weapon.id,
		key,
		refinement: weapon.refinement,
		level: weapon.level,
		ascension: weapon.ascension,
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
