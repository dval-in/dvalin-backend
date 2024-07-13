export interface RawBanner {
	version: string;
	name: string;
	startDuration: string;
	duration: string;
	featured: string[];
	type: 'Beginner' | 'Permanent' | 'Character' | 'Weapon' | 'Chronicled';
	id: string;
}

export type Banner = {
	id: string;
	type: 'Beginner' | 'Permanent' | 'Character' | 'Weapon' | 'Chronicled';
	startDuration: Date;
	duration: Date;
};
