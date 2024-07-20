import { type Express } from 'express';
import { wishService } from '../../services/wish.service.ts';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler.ts';
export class WishRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/wish', async (req, res) => {
			if (!req.user?.userId) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}

			const authkey =
				typeof req.query.authkey === 'string'
					? decodeURIComponent(req.query.authkey)
					: null;

			const response = await wishService.checkOrCreateJob(req.user.userId, authkey);
			response.match(
				(data) => sendSuccessResponse(res, data),
				(error) => sendErrorResponse(res, 500, error.message)
			);
		});

		this.app.get('/wish/status', async (req, res) => {
			if (!req.user?.userId) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}

			const response = await wishService.getJobStatus(req.user.userId);
			response.match(
				(data) => sendSuccessResponse(res, data),
				(error) => sendErrorResponse(res, 500, error.message)
			);
		});
	}
}
