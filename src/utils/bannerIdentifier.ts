import axios from 'axios';
import { logToConsole } from './log';
import { Banner, BannerKeyType } from '../types/frontend/banner';
import { err, ok, Result } from 'neverthrow';
interface RawBanner extends Omit<Banner, 'startDuration' | 'duration'> {
	startDuration: string;
	duration: string;
}

export const getBannerData = async (): Promise<Result<Banner[], Error>> => {
	try {
		const response = await axios.get<RawBanner[]>(
			`https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/EN/banners.json`
		);

		if (response.status !== 200) {
			return err(new Error(`Failed to get banner data: ${response.status}`));
		}
		const banners: Banner[] = [];
		for (const banner of response.data) {
			banners.push({
				...banner,
				startDuration: new Date(banner.startDuration),
				duration:
					banner.duration === 'TBA' || banner.duration === 'Indefinite'
						? new Date('9999-12-31')
						: new Date(banner.duration)
			});
		}
		return ok(banners);
	} catch (e) {
		return err(new Error('Failed to get banner data'));
	}
};

// converts from 301, 302, 303
export const convertGachaType = (gachaType: string): BannerKeyType => {
	switch (gachaType) {
		case '100':
			return 'Beginner';
		case '200':
			return 'Permanent';
		case '301':
		case '400':
			return 'Character';
		case '500':
			return 'Chronicled';
		case '302':
			return 'Weapon';
		default:
			logToConsole('utils bannerId', 'Failed to convert gachaType' + gachaType, 'error');
			return 'Permanent';
	}
};
