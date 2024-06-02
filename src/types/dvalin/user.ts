export interface IUser {
	server?: ServerKey;
	ar: number;
	uid?: number;
	wl: number;
}

const serverKeys = ['Europe', 'America', 'Asia', 'HK-TW', 'China'];

export type ServerKey = (typeof serverKeys)[number];

export const isServerKey = (key: string): key is ServerKey => {
	return serverKeys.includes(key);
};
