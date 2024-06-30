import { Character } from '@prisma/client';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export const getCharactersByUid = async (uid: string): Promise<Result<Character[], Error>> => {
	try {
		const characters = await prisma.character.findMany({
			where: {
				uid
			}
		});

		return ok(characters);
	} catch (error) {
		return err(new Error('Failed to retrieve characters'));
	}
};

export const saveCharacter = async (
	characterData: Character
): Promise<Result<Character, Error>> => {
	try {
		const { key, uid, ...restData } = characterData;
		const upsertedCharacter = await prisma.character.upsert({
			where: {
				id: {
					key: key,
					uid: uid
				}
			},
			update: restData,
			create: characterData
		});

		return ok(upsertedCharacter);
	} catch (error) {
		return err(new Error('Failed to save character'));
	}
};

export const saveCharacters = async (
	characters: (Partial<Character> & { key: string; uid: string })[]
): Promise<Result<void, Error>> => {
	try {
		const updates = characters.map((character) =>
			prisma.character.upsert({
				where: {
					id: {
						key: character.key,
						uid: character.uid
					}
				},
				update: character,
				create: {
					...character
				}
			})
		);
		await prisma.$transaction(updates);
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to save characters'));
	}
};

export const saveCharactersConstellation = async (
	characters: { key: string; constellation: number }[],
	uid: string
): Promise<Result<void, Error>> => {
	try {
		const updates = characters.map((character) =>
			prisma.character.upsert({
				where: {
					id: {
						key: character.key,
						uid: uid
					}
				},
				update: {
					constellation: character.constellation
				},
				create: {
					...character,
					uid: uid
				}
			})
		);
		await prisma.$transaction(updates);
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to save characters constellation'));
	}
};
