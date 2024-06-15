import { saveWeapon } from '../db/models/weapons';
import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { Result, ok, err } from 'neverthrow';

class WeaponService {
	async saveWeaponForUser(userId: string, weapon: any): Promise<Result<void, Error>> {
		if (!weapon || typeof weapon !== 'object' || !('key' in weapon)) {
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

		const saveWeaponResult = await saveWeapon({ ...weapon, uid });
		if (saveWeaponResult.isErr()) {
			return err(saveWeaponResult.error);
		}

		return ok(undefined);
	}
}

export const weaponService = new WeaponService();
