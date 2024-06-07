import { getCharactersByUid, saveCharacter } from '../../db/character';
import { UserProfile } from '../../types/dvalin/dvalinFile';

export const handleCharacters = async (
	userProfile: UserProfile & { userId: string },
	uid: string
) => {
	if (!userProfile.characters) return;

	const transformedCharacters = Object.entries(userProfile.characters).map(
		([key, character]) => ({
			key,
			level: character.level || 1,
			constellation: character.constellation || 0,
			ascension: character.ascension || 0,
			talentAuto: character.talent.auto || 1,
			talentSkill: character.talent.skill || 1,
			talentBurst: character.talent.burst || 1,
			manualConstellations: character.manualConstellations || null
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
