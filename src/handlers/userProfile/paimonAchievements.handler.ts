import { getAchievementsByUid, saveAchievements } from '../../db/models/achievements';
import { err, ok, Result } from 'neverthrow';
import { PaimonFile } from '../../types/frontend/paimonFIle';

export const handlePaimonAchievements = async (
	userProfile: PaimonFile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile['achievement']) return ok(undefined);

	const newAchievements = Object.entries(userProfile['achievement']).flatMap(
		([category, achievements]) =>
			Object.entries(achievements).map(([key, achieved]) => ({
				key: Number(key),
				uid,
				achieved
			}))
	);
	const currentAchievementsResult = await getAchievementsByUid(uid);

	if (currentAchievementsResult.isErr()) {
		return err(currentAchievementsResult.error);
	}

	const currentAchievements = currentAchievementsResult.value;

	if (!currentAchievements || currentAchievements.length === 0) {
		const saveResult = await saveAchievements(newAchievements);
		if (saveResult.isErr()) {
			return err(saveResult.error);
		}
	} else {
		const saveResult = await saveAchievements(newAchievements);
		if (saveResult.isErr()) {
			return err(saveResult.error);
		}
	}

	return ok(undefined);
};
