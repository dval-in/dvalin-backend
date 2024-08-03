import { IAchievements } from './achievement';
import { IArtifact } from './artifact';
import { ICharacters } from './character';
import { Config } from './config';
import { IFurnishings } from './furnishing';
import { IMaterials } from './material';
import { IUser } from './user';
import { IWeapon } from './weapon';
import { IWishes } from './wish';

export interface UserProfile {
	format: 'dvalin';
	version: number;
	config: Config;
	account: IUser;
	auth: string[];
	lastUpdated?: Date;
	achievements?: IAchievements;
	artifacts?: IArtifact[];
	characters?: ICharacters;
	furnishing?: IFurnishings;
	materials?: IMaterials;
	weapons?: IWeapon[];
	wishes?: IWishes;
}

export const isDvalinUserProfile = (object: unknown): object is UserProfile => {
	if (
		typeof object === 'object' &&
		object !== null &&
		'format' in object &&
		object.format === 'dvalin'
	) {
		return true;
	}
	return false;
};
