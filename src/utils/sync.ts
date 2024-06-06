import { Wish } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getAchievementsByUid, saveAchievements } from '../db/achievements';
import { getCharactersByUid, saveCharacter } from '../db/character';
import { getWeaponsByUid, saveWeapon } from '../db/weapons';
import { getWishesByUid, createMultipleWishes } from '../db/wishes';
import { UserProfile } from '../types/dvalin/dvalinFile';
import { BKTree } from './BKTree';
import { get } from 'http';
import { getGenshinAccountsByUser } from '../db/genshinAccount';

export const importSync = async (
	userProfile: UserProfile & { userId: string },
	isPaimon: boolean,
	bktree: BKTree
) => {
	if (!(userProfile.user && userProfile.user.uid)) {
		throw new Error('User profile is missing UID');
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

		if (isPaimon) {
			type PaimonWish = {
				type: string;
				code: string;
				id: string;
				time: string;
				pity: number;
			};

			(allWishes as unknown as PaimonWish[]).forEach((wish: PaimonWish) => {
				const newWishFormat: Omit<Wish, 'createdAt'> = {
					id: randomUUID(),
					uid: uid,
					name: bktree.search(wish.id)[0].word,
					itemType: wish.type,
					time: new Date(wish.time),
					gachaType: wish.code,
					pity: wish.pity.toString(),
					wasImported: true,
					rankType: 'default_rarity' // Default value for rarity
				};
				newlyFormatedWishes.push(newWishFormat);
			});
		}
		allWishes.forEach((wish) => {
			const newWishFormat: Omit<Wish, 'createdAt'> = {
				id: wish.number.toString() || randomUUID(),
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
			if (isPaimon) {
				throw new Error('Paimon import require initial import on dvalin website');
			}
			await createMultipleWishes(newlyFormatedWishes);
		} else {
			let newWishes;
			if (isPaimon) {
				const firstWishSave: number = currentWishes.reduce((acc: number, wish) => {
					return wish.time.getTime() < acc ? wish.time.getTime() : acc;
				}, 9999999999999);
				newWishes = newlyFormatedWishes.filter(
					(wish) => wish.time.getTime() < firstWishSave
				);
			} else {
				newWishes = newlyFormatedWishes.filter(
					(wish) => !currentWishes.some((w) => w.id === wish.id)
				);
			}
			if (newWishes.length > 0) {
				await createMultipleWishes(newWishes);
			}
		}
	}
	if (userProfile.achievements) {
		const achievements = userProfile.achievements;
		const newAchievements = [];
		for (const [key, achieved] of Object.entries(achievements)) {
			newAchievements.push({
				key: Number(key),
				uid: uid,
				achieved: achieved
			});
		}

		const currentAchievements = await getAchievementsByUid(uid);
		if (!currentAchievements || currentAchievements.length === 0) {
			await saveAchievements(newAchievements);
		} else {
			const filteredAchievements = newAchievements.filter(
				(achievement) => !currentAchievements.some((a) => a.key === achievement.key)
			);
			await saveAchievements(filteredAchievements);
		}
	}

	if (userProfile.characters) {
		const characters = userProfile.characters;
		const transformedCharacters = Object.entries(characters).map(([key, character]) => ({
			key,
			level: character.level || 1,
			constellation: character.constellation || 0,
			ascension: character.ascension || 0,
			talentAuto: character.talent.auto || 1,
			talentSkill: character.talent.skill || 1,
			talentBurst: character.talent.burst || 1,
			manualConstellations: character.manualConstellations || null
		}));

		const currentCharacters = await getCharactersByUid(uid);
		if (!currentCharacters || currentCharacters.length === 0) {
			transformedCharacters.forEach(async (character) => {
				await saveCharacter({ ...character, uid });
			});
		} else {
			const filteredCharacters = transformedCharacters.filter(
				(character) => !currentCharacters.some((c) => c.key === character.key)
			);
			filteredCharacters.forEach(async (character) => {
				await saveCharacter({ ...character, uid });
			});
		}
	}
	if (userProfile.weapons) {
		const weapons = userProfile.weapons;
		const transformedWeapons = Object.entries(weapons).map(([key, weapons]) => ({
			id: weapons.id || randomUUID(),
			key,
			refinement: weapons.refinement || 1,
			level: weapons.level || 1,
			ascension: weapons.ascension || 1,
			characterKey: weapons.characterKey || null
		}));

		const currentWeapons = await getWeaponsByUid(uid);
		if (!currentWeapons || currentWeapons.length === 0) {
			transformedWeapons.forEach(async (weapon) => {
				await saveWeapon({ ...weapon, uid });
			});
		} else {
			const filteredWeapon = currentWeapons.filter(
				(weapon) => !currentWeapons.some((c) => c.id === weapon.id)
			);
			filteredWeapon.forEach(async (weapon) => {
				await saveWeapon({ ...weapon, uid });
			});
		}
	}
	return userProfile.userId;
};

export const getUserProfile = async (userId: string) => {
	const genshinAccount = await getGenshinAccountsByUser(userId);
	let wishes = undefined;
	let user = undefined;
	let achievements = undefined;
	let characters = undefined;
	let weapons = undefined;

	if (genshinAccount !== undefined) {
		const account = genshinAccount[0];

		const allWishes = await getWishesByUid(account.uid);

		user = {
			server: account.server,
			ar: account.ar,
			uid: account.uid,
			wl: account.wl
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
				...(ChronicledWishes.length !== 0 ? { Chronicled: ChronicledWishes } : undefined)
			};
		}

		achievements = await getAchievementsByUid(account.uid);
		characters = await getCharactersByUid(account.uid);
		weapons = await getCharactersByUid(account.uid);
	}

	const userProfile = {
		format: 'dvalin',
		version: 1,
		...(user !== undefined ? { user } : undefined),
		...(wishes !== undefined ? { wishes } : undefined),
		...(achievements !== undefined ? { achievements } : undefined),
		...(characters !== undefined ? { characters } : undefined),
		...(weapons !== undefined ? { weapons } : undefined)
	};
	return userProfile;
};

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
