import { getCharactersByUid, saveCharacter } from '../../db/models/character';
import { UserProfile } from '../../types/frontend/dvalinFile';
import { err, ok, Result } from 'neverthrow';

export const handleCharacters = async (
	userProfile: UserProfile & { userId: string },
	uid: string
): Promise<Result<void, Error>> => {
	if (!userProfile.characters) return ok(undefined);

	const transformedCharacters = Object.entries(userProfile.characters).map(
		([key, character]) => ({
			key,
			level: character.level,
			constellation: character.constellation,
			ascension: character.ascension,
			talentAuto: character.talent.auto,
			talentSkill: character.talent.skill,
			talentBurst: character.talent.burst,
			manualConstellations: character.manualConstellations
		})
	);

	const currentCharactersResult = await getCharactersByUid(uid);

	if (currentCharactersResult.isErr()) {
		return err(currentCharactersResult.error);
	}

	const currentCharacters = currentCharactersResult.value;

	const filteredCharacters = currentCharacters
		? transformedCharacters.filter(
				(character) => !currentCharacters.some((c) => c.key === character.key)
			)
		: transformedCharacters;

	for (const character of filteredCharacters) {
		const saveResult = await saveCharacter({ ...character, uid });
		if (saveResult.isErr()) {
			return err(saveResult.error);
		}
	}

	return ok(undefined);
};
