export interface RawBanner {
	id: string;
	name: string;
	picture: string;
	featured: string[];
	startTime: string;
	endTime: string;
	bannerType: string;
}

export type RawBanners = {
	[key: string]: RawBanner;
};

export type Banner = {
	id: string;
	bannerType: string;
	startTime: Date;
	endTime: Date;
};
