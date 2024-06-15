import { saveCharacter } from '../db/models/character';
import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { MissingParametersError, NoAccountFoundError } from '../utils/errors';

class CharacterService {
	async saveCharacterForUser(userId: string, character: any) {
		if (!character || typeof character !== 'object' || !('key' in character)) {
			throw new MissingParametersError();
		}

		const accounts = await getGenshinAccountsByUser(userId);
		const uid = accounts?.[0]?.uid;

		if (uid === undefined) {
			throw new NoAccountFoundError();
		}

		await saveCharacter({ ...character, uid });
	}
}

export const characterService = new CharacterService();
