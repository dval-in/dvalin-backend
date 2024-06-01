interface Banner {
	id: string;
	name: string;
	picture: string;
	featured: string[];
	startTime: string;
	endTime: string;
}

type Banners = {
	[key: string]: Event;
};
