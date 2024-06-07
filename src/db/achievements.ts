import { Achievement } from '@prisma/client';

import { DBClient } from './prismaClient';

const prisma = DBClient.getInstance();

export const getAchievementsByUid = async (uid: string) => {
	const achievements = await prisma.achievement.findMany({
		where: {
			uid
		}
	});

	if (achievements.length === 0) {
		return undefined;
	}

	return achievements;
};

export const saveAchievements = async (achievements: Achievement[]) => {
	const upserts = achievements.map((achievement) =>
		prisma.achievement.upsert({
			where: {
				id: {
					uid: achievement.uid,
					key: achievement.key
				}
			},
			update: {
				achieved: achievement.achieved
			},
			create: achievement
		})
	);

	await prisma.$transaction(upserts);
};