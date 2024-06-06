import { BKTree } from '../utils/BKTree';
import { setupWishHistoryWorker } from './wishHistoryWorker';
import { setupBannerWorker } from './bannerDataWorker';
import { WishHistoryRoute } from '../routes/wish/routes';

export const setupWorkers = (bkTree: BKTree, wishHistoryRoute: WishHistoryRoute) => {
	setupWishHistoryWorker(bkTree);
	setupBannerWorker(wishHistoryRoute);
};
