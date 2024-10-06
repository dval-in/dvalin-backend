export type mergedAchievements = {
	achievements: {
		requirements: string;
		requirementQuestLink: string;
		hidden: string;
		type: string;
		version: string;
		steps: string | string[];
		id: number;
		name: string;
		desc: string;
		reward: number;
		order: number;
	}[];
	id: string;
	name: string;
	order: number;
	version: string;
};
