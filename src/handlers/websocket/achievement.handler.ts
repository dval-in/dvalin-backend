import { Socket } from 'socket.io';
import { saveAchievements } from '../../db/models/achievements';
import { Achievement } from '@prisma/client';
import { Result, ok, err } from 'neverthrow';

/**
 * Handles incoming achievement data and saves it to the database.
 *
 * @param {Socket} socket - The socket through which the data is received.
 * @param {unknown} data - The data received from the client.
 * @returns {Promise<Result<void, Error>>} - The result of the save operation.
 */
const handleAchievements = async (data: unknown): Promise<Result<void, Error>> => {
	if (!isAchievementData(data)) {
		return err(new Error('Invalid achievement data'));
	}

	const dataArray: Achievement[] = Array.isArray(data) ? data : [data];

	try {
		await saveAchievements(dataArray);
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to save achievements'));
	}
};

/**
 * Type guard to check if the provided data is of type Achievement.
 *
 * @param {unknown} data - The data to check.
 * @returns {boolean} - True if the data is of type Achievement, otherwise false.
 */
const isAchievementData = (data: unknown): data is Achievement => {
	return typeof data === 'object' && data !== null && 'key' in data && 'uid' in data;
};

export { handleAchievements };
