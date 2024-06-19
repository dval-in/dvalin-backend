import { Weapon } from '@prisma/client';
import { DBClient } from '../prismaClient';
import { err, ok, Result } from 'neverthrow';

const prisma = DBClient.getInstance();

export const getWeaponsByUid = async (uid: string): Promise<Result<Weapon[], Error>> => {
	try {
		const weapons = await prisma.weapon.findMany({
			where: {
				uid
			}
		});

		if (weapons.length === 0) {
			return err(new Error('No weapons found'));
		}

		return ok(weapons);
	} catch (error) {
		return err(new Error('Failed to retrieve weapons'));
	}
};

export const saveWeapon = async (weaponData: Weapon): Promise<Result<Weapon, Error>> => {
	try {
		const { id, ...restData } = weaponData;
		const upsertedWeapon = await prisma.weapon.upsert({
			where: {
				id
			},
			update: restData,
			create: weaponData
		});

		return ok(upsertedWeapon);
	} catch (error) {
		return err(new Error('Failed to save weapon'));
	}
};

export const saveWeapons = async (weapons: Weapon[]): Promise<Result<void, Error>> => {
	try {
		const updates = weapons.map((weapon) =>
			prisma.weapon.upsert({
				where: {
					id: weapon.id
				},
				update: weapon,
				create: {
					...weapon
				}
			})
		);

		await prisma.$transaction(updates);
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to save weapons'));
	}
};

export const saveWeaponsRefinement = async (
	weapons: { id: string; refinement: number }[],
	uid: string
): Promise<Result<void, Error>> => {
	try {
		const updates = weapons.map((weapon) =>
			prisma.weapon.update({
				where: {
					id: weapon.id
				},
				data: {
					refinement: weapon.refinement
				}
			})
		);

		await prisma.$transaction(updates);
		return ok(undefined);
	} catch (error) {
		return err(new Error('Failed to save weapons refinement'));
	}
};

export const deleteWeapon = async (id: string): Promise<Result<Weapon, Error>> => {
	try {
		const deletedWeapon = await prisma.weapon.delete({
			where: {
				id
			}
		});

		return ok(deletedWeapon);
	} catch (error) {
		return err(new Error('Failed to delete weapon'));
	}
};

export const getNonRefinedWeapons = async (uid: string): Promise<Result<Weapon[], Error>> => {
	try {
		const weapons = await prisma.weapon.findMany({
			where: {
				uid,
				refinement: {
					lt: 5
				}
			}
		});

		return ok(weapons);
	} catch (error) {
		return err(new Error('Failed to retrieve non-refined weapons'));
	}
};
