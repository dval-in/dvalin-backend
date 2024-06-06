import { Weapon } from '@prisma/client';
import { DBClient } from './prismaClient';

const prisma = DBClient.getInstance();

export const getWeaponsByUid = async (uid: string) => {
	const weapons = await prisma.weapon.findMany({
		where: {
			uid
		}
	});

	if (weapons.length === 0) {
		return undefined;
	}

	return weapons;
};

export const saveWeapon = async (weaponData: Weapon) => {
	const { id, ...restData } = weaponData;
	const upsertedWeapon = await prisma.weapon.upsert({
		where: {
			id
		},
		update: restData,
		create: {
			...restData
		}
	});

	return upsertedWeapon;
};

export const saveWeaponsRefinement = async (
	weapons: { id: string; refinement: number }[],
	uid: string
) => {
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
};

export const deleteWeapon = async (id: string) => {
	const deletedWeapon = await prisma.weapon.delete({
		where: {
			id
		}
	});

	return deletedWeapon;
};

export const getNonRefinedWeapons = async (uid: string) => {
	const weapons = await prisma.weapon.findMany({
		where: {
			uid,
			refinement: {
				lt: 5
			}
		}
	});
	return weapons;
};
