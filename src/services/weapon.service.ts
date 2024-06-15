import { saveWeapon } from '../db/models/weapons';
import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { MissingParametersError, NoAccountFoundError } from '../utils/errors';

class WeaponService {
	async saveWeaponForUser(userId: string, weapon: any) {
		if (!weapon || typeof weapon !== 'object' || !('key' in weapon)) {
			throw new MissingParametersError();
		}

		const accounts = await getGenshinAccountsByUser(userId);
		const uid = accounts?.[0]?.uid;

		if (uid === undefined) {
			throw new NoAccountFoundError();
		}

		await saveWeapon({ ...weapon, uid });
	}
}

export const weaponService = new WeaponService();
