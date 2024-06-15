import { saveCharacter } from '../db/models/character';
import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { Result, ok, err } from 'neverthrow';

class CharacterService {
	async saveCharacterForUser(userId: string, character: any): Promise<Result<void, Error>> {
		if (!character || typeof character !== 'object' || !('key' in character)) {
			return err(new Error('Missing parameters'));
		}

		const accountsResult = await getGenshinAccountsByUser(userId);
		if (accountsResult.isErr()) {
			return err(accountsResult.error);
		}

		const accounts = accountsResult.value;
		const uid = accounts?.[0]?.uid;

		if (uid === undefined) {
			return err(new Error('No account found'));
		}

		const saveCharacterResult = await saveCharacter({ ...character, uid });
		if (saveCharacterResult.isErr()) {
			return err(saveCharacterResult.error);
		}

		return ok(undefined);
	}
}

export const characterService = new CharacterService();
