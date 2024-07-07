import axios from 'axios';
import { logToConsole } from './log';
import { bannerdata } from '../services/banner.service';
import { Banner, RawBanners } from '../types/banner';

export const getBannerData = async (): Promise<Banner[] | undefined> => {
	try {
		const response = await axios.get(
			`https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/EN/banners.json`
		);

		if (response.status !== 200) {
			return undefined;
		}

		return parseBannerDates(response.data);
	} catch (e) {
		logToConsole('utils bannerId', `Failed to get banner data: ${e}`);
		return undefined;
	}
};

const parseBannerDates = (banners: RawBanners): Banner[] => {
	const result: Banner[] = [];

	for (const key in banners) {
		if (banners.hasOwnProperty(key)) {
			const { id, bannerType, startTime, endTime } = banners[key];
			result.push({
				id,
				bannerType: bannerType,
				startTime: new Date(startTime),
				endTime: new Date(endTime)
			});
		}
	}

	result.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
	return result;
};

// from utc time to bannerid
export const getBannerIdFromTime = (gachaType: string, time: Date): string => {
	const found = bannerdata!.find(
		(banner) =>
			banner.bannerType === gachaType && banner.startTime <= time && banner.endTime >= time
	);
	if (!found) {
		logToConsole('utils bannerId', 'Failed to find banner');
		return 'BANNERNOTFOUND';
	}
	return found.id;
};
