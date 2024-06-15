import { Index } from '../types/models/dataIndex';
import { BKTree } from '../handlers/BKTree';
import { setupUserProfileSyncWorker } from './userProfileSync.worker';
import { setupWishWorker } from './wish.worker';

export const setupWorkers = (bkTree: BKTree, dataIndex: Index) => {
	setupWishWorker(bkTree);
	setupUserProfileSyncWorker(bkTree, dataIndex);
};
