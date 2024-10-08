import axios from 'axios';
import { Banner, BannerData } from '../types/models/banner';
import { err, ok, Result } from 'neverthrow';
import { queryGitHubFile } from './github';
interface RawBanner extends Omit<Banner, 'startDuration' | 'duration'> {
	startDuration: string;
	duration: string;
}

export const getBannerData = async (): Promise<Result<BannerData, Error>> => {
	try {
		const response = await axios.get<{ banner: RawBanner[] }>(
			`https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/EN/Banners.json`
		);
		const fileData = queryGitHubFile<{ banner: RawBanner[] }>('EN', 'Banners');
		if (response.status !== 200) {
			return err(new Error(`Failed to get banner data: ${response.status}`));
		}
		const banners: Banner[] = [];
		for (const banner of response.data.banner) {
			banners.push({
				...banner,
				startDuration: new Date(banner.startDuration),
				duration:
					banner.duration === 'TBA' || banner.duration === 'Indefinite'
						? new Date('9999-12-31')
						: new Date(banner.duration)
			});
		}
		const characterBanners = banners.filter((banner) => banner.type === 'Character');
		const weaponBanners = banners.filter((banner) => banner.type === 'Weapon');
		const permanentBanner = banners.filter((banner) => banner.type === 'Permanent');
		const chronicledBanner = banners.filter((banner) => banner.type === 'Chronicled');
		const beginnerBanner = banners.filter((banner) => banner.type === 'Beginner');
		const bannerData = {
			'301': characterBanners,
			'302': weaponBanners,
			'200': permanentBanner,
			'500': chronicledBanner,
			'100': beginnerBanner
		};

		return ok(bannerData);
	} catch (e) {
		return err(new Error('Failed to get banner data' + e));
	}
};
