import { Socket } from 'socket.io';
import { saveAchievements } from '../db/achievements';
import { Achievement } from '@prisma/client';

const handleAchievements = (socket: Socket, data: unknown) => {
	if (!isAchievementData(data)) {
		socket.emit('error', { code: 422, message: 'MISSING_ACHIEVEMENTS' });
		return;
	}

	saveAchievements(data.achievements)
		.then(() => {
			socket.emit('achievementSaved', { message: 'Achievements saved successfully' });
		})
		.catch(() => {
			socket.emit('error', { code: 500, message: 'INTERNAL_SERVER_ERROR' });
		});
};

const isAchievementData = (data: unknown): data is Achievement => {
	return (
		typeof data === 'object' &&
		data !== null &&
		'key' in data &&
		'uid' in data &&
		Array.isArray(data.achievements)
	);
};
export { handleAchievements };
