export interface RawBanner {
	id: string;
	name: string;
	picture: string;
	featured: string[];
	startTime: string;
	endTime: string;
	bannerType: number;
}

export type RawBanners = {
	[key: string]: RawBanner;
};

export type Banner = {
	id: string;
	bannerType: number;
	startTime: Date;
	endTime: Date;
};
