import { Achievement } from '@prisma/client';

type TransformedAchievement = {
	id: number;
	achieved: boolean;
	preStage?: number;
};

const transformAchievement = (achievements: Achievement[]) => {
	const sortedAchievements: { [key: string]: TransformedAchievement[] } = {};
	achievements.forEach(({ achievementCategory, preStage, id, achieved }) => {
		const entry: TransformedAchievement = { id, achieved };
		if (preStage !== null) {
			entry.preStage = preStage;
		}
		if (!sortedAchievements[achievementCategory]) {
			sortedAchievements[achievementCategory] = [];
		}
		sortedAchievements[achievementCategory].push(entry);
	});

	return sortedAchievements;
};

export { transformAchievement };
