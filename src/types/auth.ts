const providersList = ['Github', 'Google', 'Microsoft'];

export type Provider = (typeof providersList)[number];

export const isProvider = (key: string): key is Provider => {
	return providersList.includes(key);
};

export interface SessionUser {
	userId: string;
}
