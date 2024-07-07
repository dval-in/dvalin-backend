import { logToConsole } from '../utils/log';
import { getBannerData } from '../utils/bannerIdentifier';
import { Banner } from '../types/banner';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';

let bannerServiceInstance: BannerService | null = null;

const setupBannerService = (): BannerService => {
	if (!bannerServiceInstance) {
		bannerServiceInstance = new BannerService();

		(async () => {
			await bannerServiceInstance!.initialise().then(async () => {
				if (bannerdata) {
					bannerServiceInstance!.isInitialised = true;
				}
			});
		})();
	}
	return bannerServiceInstance;
};

const isBannerServiceInitialised = (): boolean => {
	return bannerServiceInstance?.isInitialised || false;
};

let bannerdata: Banner[] | undefined;

class BannerService {
	public isInitialised: boolean = false;
	private updateInterval = 60 * 60 * 100;
	private scheduler = new ToadScheduler();

	constructor() {}

	public async initialise() {
		await this.updateBannerData();
		logToConsole('BannerDataService', 'Active: bannerdata updater');
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

			logToConsole('BannerDataService', `Attempt ${attempts} failed`);

			if (attempts >= maxRetries) {
				logToConsole('BannerDataService', 'All attempts failed: update bannerdata');
			} else {
				await this.delay(2000);
			}
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async startUpdates() {
		await this.updateBannerData();
		logToConsole('BannerDataService', 'First initialisation completed');

		const task = new AsyncTask('Banner Data Service', () => {
			return this.updateBannerData();
		});
		const job = new SimpleIntervalJob({ hours: 12 }, task);
		this.scheduler.addSimpleIntervalJob(job);

		setInterval(async () => {}, this.updateInterval);
	}
}

export { bannerdata, setupBannerService, BannerService, isBannerServiceInitialised };
