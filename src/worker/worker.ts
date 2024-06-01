import { BKTree } from '../utils/BKTree';
import { setupWishHistoryWorker } from './wishHistoryWorker';
import { setupBannerWorker } from './bannerDataWorker';

export const setupWorkers = (bkTree: BKTree) => {
	setupWishHistoryWorker(bkTree);
	setupBannerWorker();
};
