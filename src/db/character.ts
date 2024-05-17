import { Character, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const saveCharacter = async (characterData: Omit<Character, 'uid'>, uid: string) => {
	const { id, ...restData } = characterData;

	const upsertedCharacter = await prisma.character.upsert({
		where: {
			id: id,
			uid: uid
		},
		update: restData,
		create: {
			id: id,
			uid: uid,
			...restData
		}
	});

	return upsertedCharacter;
};

export const saveCharactersConstellation = async (
	characters: { id: string; constellation: number }[],
	uid: string
) => {
	const updates = characters.map((character) =>
		prisma.character.upsert({
			where: {
				uid: uid,
				id: character.id
			},
			update: {
				constellation: character.constellation
			},
			create: {
				id: character.id,
				uid: uid,
				constellation: character.constellation
			}
		})
	);
	await prisma.$transaction(updates);
};
