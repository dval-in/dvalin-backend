import { type Express } from 'express';
import { wishService } from '../../services/wish.service';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { MissingUserError, MissingAuthKeyError, InvalidAuthKeyError } from '../../utils/errors';

export class WishRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/wish', async (req, res) => {
			if (!req.user || !req.user.userId) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}
			const authkey =
				typeof req.query.authkey === 'string'
					? decodeURIComponent(req.query.authkey)
					: null;

			try {
				const response = await wishService.checkOrCreateJob(req.user.userId, authkey);
				sendSuccessResponse(res, response);
			} catch (error) {
				if (error instanceof MissingUserError) {
					sendErrorResponse(res, 500, error.message);
				} else if (error instanceof MissingAuthKeyError) {
					sendErrorResponse(res, 400, error.message);
				} else if (error instanceof InvalidAuthKeyError) {
					sendErrorResponse(res, 500, error.message);
				} else {
					sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
				}
			}
		});

		this.app.get('/wish/status', async (req, res) => {
			if (!req.user || !req.user.userId) {
				return sendErrorResponse(res, 500, 'MISSING_USER');
			}
			try {
				const response = await wishService.getJobStatus(req.user.userId);
				sendSuccessResponse(res, response);
			} catch (error) {
				if (error instanceof MissingUserError) {
					sendErrorResponse(res, 500, error.message);
				} else {
					sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR');
				}
			}
		});
	}
}
