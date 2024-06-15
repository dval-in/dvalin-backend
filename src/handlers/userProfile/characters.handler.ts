import { getCharactersByUid, saveCharacter } from '../../db/models/character';
import { UserProfile } from '../../types/frontend/dvalinFile';

export const handleCharacters = async (
	userProfile: UserProfile & { userId: string },
	uid: string
) => {
	if (!userProfile.characters) return;

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

	const currentCharacters = await getCharactersByUid(uid);
	const filteredCharacters = currentCharacters
		? transformedCharacters.filter(
				(character) => !currentCharacters.some((c) => c.key === character.key)
			)
		: transformedCharacters;

	for (const character of filteredCharacters) {
		await saveCharacter({ ...character, uid });
	}
};
