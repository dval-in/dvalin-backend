import { saveAchievements } from '../../db/models/achievements';
import { err, ok, Result } from 'neverthrow';
import { PaimonFile } from '../../types/frontend/paimonFile';

export const handlePaimonAchievements = async (
	userProfile: PaimonFile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile['achievement']) {
		return ok(undefined);
	}

	const newAchievements = Object.entries(userProfile['achievement']).flatMap(
		([_category, achievements]) =>
			Object.entries(achievements).map(([key, achieved]) => ({
				key: Number(key),
				uid,
				achieved
			}))
	);

	const saveResult = await saveAchievements(newAchievements);
	if (saveResult.isErr()) {
		return err(saveResult.error);
	}

	return ok(undefined);
};
