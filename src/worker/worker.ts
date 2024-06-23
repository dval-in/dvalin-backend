import { BannerService } from '../services/bannerData';
import { BKTree } from '../utils/BKTree';
import { setupWishHistoryWorker } from './wishHistoryWorker';

export const setupWorkers = (bkTree: BKTree, bannerService: BannerService) => {
	setupWishHistoryWorker(bkTree, bannerService);
};
