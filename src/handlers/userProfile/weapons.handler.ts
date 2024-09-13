import { saveWeapons } from '../../db/models/weapons';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { err, ok, Result } from 'neverthrow';

export const handleWeapons = async (
	userProfile: UserProfile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile.weapons) {
		return ok(undefined);
	}

	const transformedWeapons = Object.entries(userProfile.weapons).map(([key, weapon]) => ({
		id: weapon.id,
		key,
		refinement: weapon.refinement,
		level: weapon.level,
		ascension: weapon.ascension,
		characterKey: weapon.characterKey || null,
		uid
	}));

	const result = await saveWeapons(transformedWeapons);
	if (result.isErr()) {
		return err(result.error);
	}
	return ok(undefined);
};
