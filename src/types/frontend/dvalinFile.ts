import { IAchievements } from './achievement';
import { IArtifact } from './artifact';
import { ICharacters } from './character';
import { Config } from './config';
import { IFurnishings } from './furnishing';
import { IMaterials } from './material';
import { IUser } from './user';
import { IWeapons } from './weapon';
import { IWishes } from './wish';

export interface UserProfile {
	format: 'dvalin' | 'paimon';
	version: number;
	config: Config;
	user?: IUser;
	achievements?: IAchievements;
	artifacts?: IArtifact[];
	characters?: ICharacters;
	furnishing?: IFurnishings;
	materials?: IMaterials;
	weapons?: IWeapons;
	wishes?: IWishes;
}

export const isDvalinUserProfile = (object: unknown): object is UserProfile => {
	if (typeof object === 'object' && object !== null) {
		if ('format' in object) {
			if (object.format === 'dvalin') {
				return true;
			}
		}
	}
	return false;
};
