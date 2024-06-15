import { getAchievementsByUid, saveAchievements } from '../../db/models/achievements';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { err, ok, Result } from 'neverthrow';

export const handleAchievements = async (
	userProfile: UserProfile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile.achievements) return ok(undefined);

	const newAchievements = Object.entries(userProfile.achievements).map(([key, achieved]) => ({
		key: Number(key),
		uid,
		achieved
	}));

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
		const filteredAchievements = newAchievements.filter(
			(achievement) => !currentAchievements.some((a) => a.key === achievement.key)
		);
		const saveResult = await saveAchievements(filteredAchievements);
		if (saveResult.isErr()) {
			return err(saveResult.error);
		}
	}

	return ok(undefined);
};
