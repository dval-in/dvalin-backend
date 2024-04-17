export const languageList = [
	'DE',
	'EN',
	'ES',
	'FR',
	'ID',
	'IT',
	'JP',
	'KO',
	'PT',
	'RU',
	'TH',
	'TR',
	'VI',
	'ZH-S',
	'ZH-T'
];

export type LanguageKey = (typeof languageList)[number];

export const isLanguageKey = (key: string): key is LanguageKey => {
	return languageList.includes(key);
};
