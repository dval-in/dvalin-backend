import { saveAchievements } from '../../db/models/achievements';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { err, ok, Result } from 'neverthrow';

export const handleAchievements = async (
	userProfile: UserProfile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile.achievements) {
		return ok(undefined);
	}

	const newAchievements = Object.entries(userProfile.achievements).map(([key, achievement]) => ({
		key: Number(key),
		uid,
		achieved: achievement.achieved,
		progression: achievement.progression
	}));

	const saveResult = await saveAchievements(newAchievements);
	if (saveResult.isErr()) {
		return err(saveResult.error);
	}

	return ok(undefined);
};
