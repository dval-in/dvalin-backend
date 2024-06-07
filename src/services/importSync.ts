import { UserProfile } from '../types/dvalin/dvalinFile';
import { BKTree } from '../utils/BKTree';
import { handleWishes } from '../handlers/user/wishesHandler';
import { handleAchievements } from '../handlers/user/achievementsHandler';
import { handleCharacters } from '../handlers/user/charactersHandler';
import { handleWeapons } from '../handlers/user/weaponsHandler';
import { Index } from '../types/dataIndex';

export const importSync = async (
	userProfile: UserProfile & { userId: string },
	isPaimon: boolean,
	bktree: BKTree,
	dataIndex: Index
) => {
	if (!userProfile || !userProfile.user?.uid) {
		throw new Error('User profile is missing UID');
	}

	const uid = userProfile.user.uid.toString();
	await handleWishes(userProfile, uid, isPaimon, bktree, dataIndex);
	await handleAchievements(userProfile, uid);
	await handleCharacters(userProfile, uid);
	await handleWeapons(userProfile, uid);

	return userProfile.userId;
};
