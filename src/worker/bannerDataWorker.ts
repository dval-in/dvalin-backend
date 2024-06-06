import { logToConsole } from '../utils/log';
import { getBannerData } from '../utils/bannerIdentifier';
import { Banner } from '../types/banner';
import { WishHistoryRoute } from '../routes/wish/routes';

const setupBannerWorker = (wishHistoryRoute: WishHistoryRoute) => {
	const bannerservice = new BannerService();
	bannerservice.initialise().then(() => {
		if (bannerdata) {
			wishHistoryRoute.isInitialised = true;
		}
	});
};

let bannerdata: Banner[] | undefined;

class BannerService {
	private updateInterval = 60 * 60 * 100;

	constructor() {}

	public async initialise() {
		await this.updateBannerData();
		logToConsole('bannerDataWorker', 'active: bannerdata updater');
		this.startUpdates();
	}

	private async updateBannerData(): Promise<void> {
		const maxRetries = 5;
		let attempts = 0;

		for (attempts; attempts < maxRetries; attempts++) {
			const data = await getBannerData();

			if (data !== undefined) {
				bannerdata = data;
				break;
			}

			logToConsole('bannerDataWorker', `Attempt ${attempts} failed`);

			if (attempts >= maxRetries) {
				logToConsole('bannerDataWorker', 'All attempts failed: update bannerdata');
			} else {
				await this.delay(2000);
			}
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async startUpdates() {
		setInterval(async () => {
			await this.updateBannerData();
		}, this.updateInterval);
	}
}

export { bannerdata, setupBannerWorker };
