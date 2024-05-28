import { type Express, type Request, type Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';
import { getGenshinAccountsByUser } from '../../db/genshinAccount';
import { createMultipleWishes, getWishesByUid } from '../../db/wishes';
import { Wish } from '@prisma/client';
import { getAchievementsByUid, saveAchievements } from '../../db/achievements';
import { transformAchievement } from '../../utils/achievement';
import { getCharactersByUid, saveCharacter } from '../../db/character';
import { isDvalinUserProfile, UserProfile } from '../../types/dvalin';

const convertToFrontendWishes = (wishes: Wish[]) => {
	return wishes.map((wish) => ({
		type: wish.itemType,
		number: wish.id,
		key: wish.name,
		date: wish.time,
		pity: wish.pity,
		rarity: wish.rankType,
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
		this.app.post('/importsync', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			if (!isDvalinUserProfile(req.body)) {
				return sendErrorResponse(res, 400, 'INVALID_FORMAT');
			}
			const userProfile: UserProfile = req.body;
			if (!(userProfile.user && userProfile.user.uid)) {
				return sendErrorResponse(res, 403, 'MISSING_UID');
			}
			const uid = userProfile.user.uid.toString();
			if (userProfile.wishes) {
				const wishes = userProfile.wishes;
				const charbanner = wishes.CharacterEvent || [];
				const weapbanner = wishes.WeaponEvent || [];
				const standbanner = wishes.Standard || [];
				const begbanner = wishes.Beginner || [];
				const chronbanner = wishes.Chronicled || [];
				const allWishes = [
					...charbanner,
					...weapbanner,
					...standbanner,
					...begbanner,
					...chronbanner
				];
				const newlyFormatedWishes: Omit<Wish, 'createdAt'>[] = [];
				allWishes.forEach((wish) => {
					const newWishFormat: Omit<Wish, 'createdAt'> = {
						id: wish.number.toString(),
						uid: uid,
						name: wish.key,
						itemType: wish.type,
						time: wish.date,
						gachaType: wish.banner,
						pity: wish.pity.toString(),
						wasImported: true,
						rankType: wish.rarity.toString()
					};
					newlyFormatedWishes.push(newWishFormat);
				});
				const currentWishes = await getWishesByUid(userProfile.user.uid.toString());
				if (!currentWishes || currentWishes.length === 0) {
					await createMultipleWishes(newlyFormatedWishes);
				} else {
					const newWishes = newlyFormatedWishes.filter(
						(wish) => !currentWishes.some((w) => w.id === wish.id)
					);
					if (newWishes.length > 0) {
						await createMultipleWishes(newWishes);
					}
				}
			}
			if (userProfile.achievements) {
				const achievementCategories = userProfile.achievements;
				const newAchievements = [];
				for (const [categoryName, achievements] of Object.entries(achievementCategories)) {
					for (const [id, achievement] of Object.entries(achievements)) {
						newAchievements.push({
							id: Number(id),
							achieved: achievement.achieved,
							preStage: Number(achievement.preStage) || null,
							achievementCategory: categoryName
						});
					}
				}
				const currentAchievements = await getAchievementsByUid(uid);
				if (!currentAchievements || currentAchievements.length === 0) {
					await saveAchievements(newAchievements, uid);
				} else {
					const filteredAchievements = newAchievements.filter(
						(achievement) => !currentAchievements.some((a) => a.id === achievement.id)
					);
					await saveAchievements(filteredAchievements, uid);
				}
			}

			if (userProfile.characters) {
				const characters = userProfile.characters;
				const transformedCharacters = Object.entries(characters).map(([id, character]) => ({
					id,
					level: character.level || null,
					constellation: character.constellation || null,
					ascension: character.ascension || null,
					talentAuto: character.talent.auto || null,
					talentSkill: character.talent.skill || null,
					talentBurst: character.talent.burst || null
				}));

				const currentCharacters = await getCharactersByUid(uid);
				if (!currentCharacters || currentCharacters.length === 0) {
					transformedCharacters.forEach(async (character) => {
						await saveCharacter(character, uid);
					});
				} else {
					const filteredCharacters = transformedCharacters.filter(
						(character) => !currentCharacters.some((c) => c.id === character.id)
					);
					filteredCharacters.forEach(async (character) => {
						await saveCharacter(character, uid);
					});
				}
			}
			sendSuccessResponse(res, { state: 'SUCCESS', data: {} });
		});
	}
}
