import { Achievement } from '@prisma/client';
import { saveAchievements } from 'db/models/achievements';
import { Result, ok, err } from 'neverthrow';

const handleAchievements = async (
	data: {
		[key: number]: {
			achieved: boolean;
			progression: string;
		};
	},
	uid: string
): Promise<Result<void, Error>> => {
	try {
		const achievements: Achievement[] = Object.entries(data).map(([key, value]) => ({
			key: Number(key),
			achieved: value.achieved,
			progression: value.progression || null,
			uid: uid
		}));

		await saveAchievements(achievements);
		return ok(undefined);
	} catch (error) {
		return err(error instanceof Error ? error : new Error('An unknown error occurred'));
	}
};

export { handleAchievements };
