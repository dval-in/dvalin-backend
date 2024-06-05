import { Character } from '@prisma/client';

import { DBClient } from './prismaClient';

const prisma = DBClient.getInstance();

export const getCharactersByUid = async (uid: string) => {
	const characters = await prisma.character.findMany({
		where: {
			uid
		}
	});

	if (characters.length === 0) {
		return undefined;
	}

	return characters;
};

export const saveCharacter = async (characterData: Character) => {
	const { key, uid, ...restData } = characterData;
	const upsertedCharacter = await prisma.character.upsert({
		where: {
			id: {
				key: key,
				uid: uid
			}
		},
		update: restData,
		create: {
			key: key,
			uid: uid,
			...restData
		}
	});

	return upsertedCharacter;
};

export const saveCharactersConstellation = async (
	characters: { key: string; constellation: number }[],
	uid: string
) => {
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
				key: character.key,
				uid: uid,
				constellation: character.constellation
			}
		})
	);
	await prisma.$transaction(updates);
};
