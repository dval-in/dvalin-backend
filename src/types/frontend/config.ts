export type Config = {
	autoRefine: {
		// decide if wishes will automatically refine weapon
		'3': boolean;
		'4': boolean;
		'5': boolean;
	};
	preferedLanguage: langKey;
};

const langKey = ['en', 'de', 'es', 'fr', 'id', 'ja', 'ko', 'pt', 'ru', 'th', 'vi', 'zh-s', 'zh-t'];

export type langKey = (typeof langKey)[number];

export const isLangKey = (key: string): key is langKey => langKey.includes(key as langKey);
