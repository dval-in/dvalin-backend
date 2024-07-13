import axios from 'axios';
import { logToConsole } from './log';
import { bannerdata } from '../services/banner.service';
import { Banner, RawBanner } from '../types/banner';
import { GachaItem } from 'types/models/wish';

export const getBannerData = async (): Promise<Banner[] | undefined> => {
	try {
		const response = await axios.get(
			`https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/EN/banners.json`
		);

		if (response.status !== 200) {
			return undefined;
		}

		return parseBannerData(response.data.banner as RawBanner[]);
	} catch (e) {
		logToConsole('utils bannerId', `Failed to get banner data: ${e}`);
		return undefined;
	}
};
const indefiniteDate = new Date('9999-12-31');
const parseBannerData = (banners: RawBanner[]): Banner[] => {
	const result: Banner[] = [];

	banners.forEach(function (banner) {
		result.push({
			id: banner.id,
			type: banner.type,
			startDuration:
				banner.duration === 'TBA' ? indefiniteDate : new Date(banner.startDuration),
			duration:
				banner.duration === 'Indefinite' || banner.duration === 'TBA'
					? indefiniteDate
					: new Date(banner.duration)
		});
	});

	result.sort((a, b) => b.duration.getTime() - a.duration.getTime());
	return result;
};

// converts from 301, 302, 303
export const convertGachaType = (gachaType: string): string => {
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
			logToConsole('utils bannerId', 'Failed to match gacha type');
			return 'Character';
	}
};

// from utc time to bannerid
export const getBannerIdFromTime = (gachaType: string, time: Date): string => {
	const found = bannerdata!.find((banner) => {
		return banner.type === gachaType && banner.startDuration <= time && banner.duration >= time;
	});

	if (!found) {
		logToConsole('utils bannerId', 'Failed to find banner' + gachaType + ' ' + time);
		return 'BANNERNOTFOUND';
	}
	return found.id;
};
