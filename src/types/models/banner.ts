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
export type BannerKeyCode = '100' | '200' | '301' | '302' | '500';

export type BannerData = {
	[key in BannerKeyCode]: Banner[];
};
