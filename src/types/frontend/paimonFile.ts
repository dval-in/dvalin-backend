import { WishKeyBanner } from './wish';

export interface PaimonFile {
	format: 'paimon';
	achievement?: {
		[key: string]: {
			[key: string]: boolean;
		};
	};
	'achievement-checklist'?: {
		[key: string]: {
			[key: string]: boolean;
		};
	};
	ar: number;
	characters?: PaimonCharacters;
	'collectables-updated'?: boolean;
	converted: string;
	fishing?: unknown;
	locale?: string;
	server?: string;
	'tcg-activedeck'?: number;
	'tcg-decks'?: {
		name: string;
		characters: { [key: string]: number };
		actions: { [key: string]: number };
	}[];
	todos?: unknown[];
	'update-time': string; // NOSONAR
	weapons?: {
		[key: string]: {
			default: number;
			manual: number;
			wish: number;
		};
	};
	'wish-counter-character-event'?: PaimonBanner;
	'wish-counter-setting'?: { firstTime: boolean; manualInput: boolean };
	'wish-counter-standard'?: PaimonBanner;
	'wish-counter-weapon-event'?: PaimonBanner;
	'wish-counter-beginners'?: PaimonBanner;
	'wish-counter-chronicled'?: PaimonBanner;
	'wish-uid'?: number;
	wl: number;
}

interface PaimonBanner {
	total: number;
	legendary: number;
	rare: number;
	pulls: PaimonPulls[];
	guaranteed?: { legendary: boolean; rare: true };
	rateoff?: {
		legendary: {
			win: number;
			lose: number;
			maxStreak: number;
			currentStreak: number;
		};
		rare: {
			win: number;
			lose: number;
			maxStreak: number;
			currentStreak: number;
		};
	};
}

export interface PaimonPulls {
	type: 'weapon' | 'character';
	code: WishKeyBanner;
	id: string;
	time: string;
	pity: number;
	rate?: number;
}

export interface PaimonCharacters {
	[key: string]: { default: number; wish: number; manual: number };
}

export const isPaimonData = (object: unknown): object is PaimonFile => {
	const hasRequiredProps = (obj): boolean => 'ar' in obj && 'update-time' in obj && 'wl' in obj;

	const hasCorrectTypes = (obj): boolean =>
		typeof obj.ar === 'number' &&
		typeof obj['update-time'] === 'string' &&
		typeof obj.wl === 'number';

	if (
		typeof object === 'object' &&
		object !== null &&
		hasRequiredProps(object) &&
		hasCorrectTypes(object)
	) {
		return true;
	}
	return false;
};
