import { setupUserProfileSyncWorker } from './userProfileSync.worker.ts';
import { setupWishWorker } from './wish.worker.ts';

export const setupWorkers = () => {
	setupWishWorker();
	setupUserProfileSyncWorker();
};
