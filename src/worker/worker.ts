import { BKTree } from '../utils/BKTree';
import { setupWishHistoryWorker } from './wishHistoryWorker';

export const setupWorkers = (bkTree: BKTree) => {
	setupWishHistoryWorker(bkTree);
};
