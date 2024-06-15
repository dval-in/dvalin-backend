import { Achievement } from '@prisma/client';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export const getAchievementsByUid = async (uid: string): Promise<Result<Achievement[], Error>> => {
	try {
		const achievements = await prisma.achievement.findMany({
			where: {
				uid
			}
		});

		if (achievements.length === 0) {
			return err(new Error('No achievements found'));
		}

		return ok(achievements);
	} catch (error) {
		return err(new Error('Failed to retrieve achievements'));
	}
};

export const saveAchievements = async (
	achievements: Achievement[]
): Promise<Result<void, Error>> => {
	try {
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
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to save achievements'));
	}
};
