import { logToConsole } from '../utils/log';
import { getBannerData } from '../utils/bannerIdentifier';
import { Banner, BannerKeyType } from '../types/frontend/banner';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { err, ok, Result } from 'neverthrow';
import { randomDelay } from '../utils/time';

class BannerService {
	private scheduler = new ToadScheduler();
	private bannerData: Banner[] = undefined;
	public isInitialized = false;

	async initialize(): Promise<Result<void, Error>> {
		const bannerResult = await this.updateBannerData();
		if (bannerResult.isErr()) {
			return err(bannerResult.error);
		}
		logToConsole('BannerDataService', 'BannerDataß updater is active');
		this.startUpdates();
		this.isInitialized = true;
		return ok(undefined);
	}

	getBannerData = (): Banner[] => {
		return this.bannerData;
	};

	private async updateBannerData(): Promise<Result<void, Error>> {
		const maxRetries = 5;
		let attempts = 0;

		for (attempts; attempts < maxRetries; attempts++) {
			const dataResult = await getBannerData();
			if (dataResult.isOk()) {
				this.bannerData = dataResult.value;
				return ok(undefined);
			}
			if (attempts >= maxRetries) {
				return err(new Error('Failed to get banner data'));
			} else {
				await randomDelay(800, 1200);
			}
		}

		return err(new Error('Failed to get banner data'));
	}

	private async startUpdates() {
		const task = new AsyncTask('Banner Data Service', () => {
			return this.updateBannerData();
		});
		const job = new SimpleIntervalJob({ hours: 24 }, task);
		this.scheduler.addSimpleIntervalJob(job);
	}

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
