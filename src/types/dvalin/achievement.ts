export type IAchievements = {
	[key in number]: IAchievement;
};

export type IAchievement = {
	achieved: boolean;
};
