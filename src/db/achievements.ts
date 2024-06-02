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
			create: {
				uid: achievement.uid,
				key: achievement.key,
				achieved: achievement.achieved
			}
		})
	);

	await prisma.$transaction(upserts);
};
