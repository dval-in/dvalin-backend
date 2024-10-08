export type IAchievements = {
	[key in number]: {
		achieved: boolean;
		progression: string;
	};
};
