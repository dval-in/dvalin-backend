import { BKTree } from '../utils/BKTree';
import { setupImportSyncWorker } from './importSyncWorker';
import { setupWishHistoryWorker } from './wishHistoryWorker';

export const setupWorkers = (bkTree: BKTree) => {
	setupWishHistoryWorker(bkTree);
	setupImportSyncWorker(bkTree);
};
