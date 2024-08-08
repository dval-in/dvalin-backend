import { getBannerData } from '../utils/bannerIdentifier';
import { Banner, BannerKeyType } from '../types/frontend/banner';
import { err, ok, Result } from 'neverthrow';
class BannerService {
	private bannerData: Banner[] = undefined;

	async initialize(): Promise<Result<void, Error>> {
		const dataResult = await getBannerData();
		if (dataResult.isOk()) {
			this.bannerData = dataResult.value;
			return ok(undefined);
		} else {
			return err(dataResult.error);
		}
	}

	getBanner = (): Banner[] => {
		return this.bannerData;
	};

	refresh = (data: Banner[]): void => {
		this.bannerData = data;
	};

	getBannerFromTime = (bannerType: BannerKeyType, timestamp: number): Banner => {
		const found = this.bannerData.find((banner) => {
			return (
				banner.type === bannerType &&
				banner.startDuration.getTime() <= timestamp &&
				banner.duration.getTime() >= timestamp
			);
		});

		if (!found) {
			return this.bannerData.find((banner) => banner.type === 'Permanent');
		}
		return found;
	};
}

export const bannerService = new BannerService();
