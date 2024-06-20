import { saveCharacters } from '../../db/models/character';
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
			manualConstellations: character.manualConstellations,
			uid
		})
	);

	const result = await saveCharacters(transformedCharacters);
	if (result.isErr()) {
		return err(result.error);
	}
	return ok(undefined);
};
