import { type Express, type Request, type Response } from 'express';
import { sendSuccessResponse } from '../../utils/sendResponse';
import { getGenshinAccountsByUser } from '../../db/genshinAccount';
import { getWishesByUid } from '../../db/wishes';
import { Wish } from '@prisma/client';
import { getAchievementsByUid } from '../../db/achievements';
import { transformAchievement } from '../../utils/achievement';
import { getCharactersByUid } from '../../db/character';

const convertToFrontendWishes = (wishes: Wish[]) => {
	return wishes.map((wish) => ({
		type: wish.itemType,
		number: wish.id,
		key: wish.name,
		date: wish.time,
		pity: wish.pity,
		banner: 'BalladInGoblets1'
	}));
};

export class UserRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/user', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			const genshinAccount = await getGenshinAccountsByUser(req.user.userId);
			let wishes = undefined;
			let user = undefined;
			let achievements = undefined;
			let characters = undefined;

			if (genshinAccount !== undefined) {
				const account = genshinAccount[0];

				const allWishes = await getWishesByUid(account.uid);

				user = {
					server: account.server || 'Europe',
					ar: account.ar || 60,
					uid: account.uid,
					wl: account.wl || 6
				};

				if (allWishes !== undefined) {
					const BeginnerWishes = convertToFrontendWishes(
						allWishes.filter((w) => w.gachaType === '100')
					);
					const StandardWishes = convertToFrontendWishes(
						allWishes.filter((w) => w.gachaType === '200')
					);
					const CharacterEventWishes = convertToFrontendWishes(
						allWishes.filter((w) => w.gachaType === '301' || w.gachaType === '400')
					);
					const WeaponEventWishes = convertToFrontendWishes(
						allWishes.filter((w) => w.gachaType === '302')
					);
					const ChronicledWishes = convertToFrontendWishes(
						allWishes.filter((w) => w.gachaType === '500')
					);

					wishes = {
						...(WeaponEventWishes.length !== 0
							? { WeaponEvent: WeaponEventWishes }
							: undefined),
						...(StandardWishes.length !== 0 ? { Standard: StandardWishes } : undefined),
						...(CharacterEventWishes.length !== 0
							? { CharacterEvent: CharacterEventWishes }
							: undefined),
						...(BeginnerWishes.length !== 0 ? { Beginner: BeginnerWishes } : undefined),
						...(ChronicledWishes.length !== 0
							? { Chronicled: ChronicledWishes }
							: undefined)
					};
				}

				achievements = await getAchievementsByUid(account.uid);
				if (achievements === undefined) {
					achievements = [];
				} else {
					achievements = transformAchievement(achievements);
				}

				characters = await getCharactersByUid(account.uid);
			}

			const userProfile = {
				format: 'dvalin',
				version: 1,
				...(user !== undefined ? { user } : undefined),
				...(wishes !== undefined ? { wishes } : undefined),
				...(achievements !== undefined ? { achievements } : undefined),
				...(characters !== undefined ? { characters } : undefined)
			};

			sendSuccessResponse(res, { state: 'SUCCESS', data: userProfile });
		});
	}
}
