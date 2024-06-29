type PlayerInfo = {
	playerInfo: {
		nickname: string;
		level: number;
		signature: string;
		worldLevel: number;
		nameCardId: number;
		finishAchievementNum: number;
		towerFloorIndex: number;
		towerLevelIndex: number;
		showAvatarInfoList: Array<{
			avatarId: number;
			level: number;
		}>;
		showNameCardIdList: number[];
		profilePicture: {
			id: number;
		};
	};
	ttl: number;
	uid: string;
};
