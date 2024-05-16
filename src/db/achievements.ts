import { Achievement, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const saveAchievements = async (achievements: Omit<Achievement, 'uid'>[], uid: string) => {
	const upserts = achievements.map((achievement) =>
		prisma.achievement.upsert({
			where: {
				uid: uid,
				id: achievement.id
			},
			update: {
				achieved: achievement.achieved
			},
			create: {
				uid: uid,
				id: achievement.id,
				achievementCategory: achievement.achievementCategory,
				achieved: achievement.achieved,
				preStage: achievement.preStage
			}
		})
	);

	await prisma.$transaction(upserts);
};
