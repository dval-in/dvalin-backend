import { getAchievementsByUid, saveAchievements } from '../../db/models/achievements';
import { UserProfile } from '../../types/frontend/dvalinFile';

export const handleAchievements = async (
	userProfile: UserProfile & { userId: string },
	uid: string
) => {
	if (!userProfile.achievements) return;

	const newAchievements = Object.entries(userProfile.achievements).map(([key, achieved]) => ({
		key: Number(key),
		uid,
		achieved
	}));

	const currentAchievements = await getAchievementsByUid(uid);
	if (!currentAchievements || currentAchievements.length === 0) {
		await saveAchievements(newAchievements);
	} else {
		const filteredAchievements = newAchievements.filter(
			(achievement) => !currentAchievements.some((a) => a.key === achievement.key)
		);
		await saveAchievements(filteredAchievements);
	}
};
