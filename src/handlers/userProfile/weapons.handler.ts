import { getWeaponsByUid, saveWeapon } from '../../db/models/weapons';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { err, ok, Result } from 'neverthrow';

export const handleWeapons = async (
	userProfile: UserProfile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile.weapons) return ok(undefined);

	const transformedWeapons = Object.entries(userProfile.weapons).map(([key, weapon]) => ({
		id: weapon.id,
		key,
		refinement: weapon.refinement,
		level: weapon.level,
		ascension: weapon.ascension,
		characterKey: weapon.characterKey || null
	}));

	const currentWeaponsResult = await getWeaponsByUid(uid);

	if (currentWeaponsResult.isErr()) {
		return err(currentWeaponsResult.error);
	}

	const currentWeapons = currentWeaponsResult.value;

	const filteredWeapons = currentWeapons
		? transformedWeapons.filter((weapon) => !currentWeapons.some((c) => c.id === weapon.id))
		: transformedWeapons;

	for (const weapon of filteredWeapons) {
		const saveResult = await saveWeapon({ ...weapon, uid });
		if (saveResult.isErr()) {
			return err(saveResult.error);
		}
	}

	return ok(undefined);
};
