import { Socket } from 'socket.io';
import { saveAchievements } from '../../db/models/achievements';
import { Achievement } from '@prisma/client';

/**
 * Handles incoming achievement data and saves it to the database.
 *
 * @param {Socket} socket - The socket through which the data is received.
 * @param {unknown} data - The data received from the client.
 */
const handleAchievements = (socket: Socket, data: unknown): void => {
	if (!isAchievementData(data)) {
		socket.emit('error', { code: 422, message: 'MISSING_ACHIEVEMENTS' });
		return;
	}

	const dataArray: Achievement[] = Array.isArray(data) ? data : [data];

	saveAchievements(dataArray)
		.then(() => {
			socket.emit('achievementSaved', { message: 'Achievements saved successfully' });
		})
		.catch(() => {
			socket.emit('error', { code: 500, message: 'INTERNAL_SERVER_ERROR' });
		});
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
