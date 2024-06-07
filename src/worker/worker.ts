import { Index } from '../types/dataIndex';
import { BKTree } from '../utils/BKTree';
import { setupImportSyncWorker } from './importSyncWorker';
import { setupWishHistoryWorker } from './wishHistoryWorker';

export const setupWorkers = (bkTree: BKTree, dataIndex: Index) => {
	setupWishHistoryWorker(bkTree);
	setupImportSyncWorker(bkTree, dataIndex);
};
