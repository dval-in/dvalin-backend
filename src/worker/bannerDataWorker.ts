import { logToConsole } from '../utils/log';
import { getBannerData } from '../utils/bannerIdentifier';

const setupBannerWorker = () => {
	const bannerservice = new BannerService();
	bannerservice.initialise();
};

let bannerdata: any;

class BannerService {
	private updateInterval = 60 * 60 * 100;

	constructor() {}

	public async initialise() {
		await this.updateBannerData();
		logToConsole('bannerDataWorker', 'active: bannerdata updater');
		this.startUpdates();
	}

	private async updateBannerData() {
		bannerdata = await getBannerData();
		if (!bannerdata) {
			logToConsole('bannerDataWorker', 'failed: update bannerdata');
		}
	}

	private async startUpdates() {
		setInterval(async () => {
			await this.updateBannerData();
		}, this.updateInterval);
	}
}

export { bannerdata, setupBannerWorker };
