import { saveWeapon } from '../db/models/weapons';
import { getGenshinAccountsByUser } from '../db/models/genshinAccount';
import { Result, ok, err } from 'neverthrow';
import { Weapon } from '@prisma/client';

class WeaponService {
	async saveWeaponForUser(userId: string, weapon: unknown): Promise<Result<void, Error>> {
		if (!isWeapon(weapon)) {
			return err(new Error('Invalid weapon data'));
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

export const isWeapon = (obj: any): obj is Weapon => {
	return typeof obj === 'object' && obj !== null && 'key' in obj && typeof obj.key === 'string';
};
