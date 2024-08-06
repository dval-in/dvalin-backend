export interface Banner {
	version: string;
	name: string;
	startDuration: Date;
	duration: Date;
	featured: string[];
	type: BannerKeyType;
	id: string;
}

export type BannerKeyType = 'Beginner' | 'Permanent' | 'Character' | 'Weapon' | 'Chronicled';
