import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { logToConsole } from '../../utils/log';
import { type Express, type Request, type Response } from 'express';
import { bannerService } from '../../services/banner.service';

export class BannerRoute {
	public isInitialized: boolean = false;

	constructor(private readonly app: Express) {
		bannerService
			.initialize()
			.then(() => {
				logToConsole('Banner', 'initialization complete');
				this.isInitialized = true;
			})
			.catch((error) => {
				logToConsole('Banner', `initialization failed: ${error.message}`);
			});
	}

	setupRoutes(): void {
		this.app.get('/banner', async (_req: Request, res: Response) => {
			if (!this.isInitialized) {
				sendErrorResponse(res, 503, 'NOT_INITIALIZED');
			}

			const bannerData = bannerService.getBanner();

			if (bannerData === undefined) {
				sendErrorResponse(res, 404, 'NOT_FOUND');
			}

			sendSuccessResponse(res, bannerData);
		});
	}
}
