import { Index } from '../types/models/dataIndex';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { setupUserProfileSyncWorker } from './userProfileSync.worker.ts';
import { setupWishWorker } from './wish.worker.ts';

export const setupWorkers = (bkTree: BKTree, dataIndex: Index) => {
	setupWishWorker(bkTree);
	setupUserProfileSyncWorker(bkTree, dataIndex);
};
