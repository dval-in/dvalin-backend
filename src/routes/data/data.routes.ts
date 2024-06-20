import { type Express, type Request, type Response } from 'express';
import { dataService } from '../../services/data.service';
import { queryGitHubFile } from '../../utils/github';
import { logToConsole } from '../../utils/log';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler';
import { isDataTypeKey } from '../../types/models/fileReference';
import { isLanguageKey } from '../../types/models/language';

export class DynamicDataRoute {
	public isInitialised: boolean = false;

	constructor(private readonly app: Express) {
		dataService
			.initialize()
			.then(() => {
				logToConsole('Data', 'initialization complete');
				this.isInitialised = true;
			})
			.catch((error) => {
				logToConsole('data', `initialization failed: ${error.message}`);
			});
	}

	setupRoutes(): void {
		this.app.get('/data/:dataType/index', async (req: Request, res: Response) => {
			if (!this.isInitialised) {
				return sendErrorResponse(res, 503, 'NOT_INITIALIZED');
			}

			const { dataType } = req.params;

			if (dataType !== 'Character' && dataType !== 'Weapon') {
				return sendErrorResponse(res, 400, 'INVALID_DATA_TYPE');
			}

			const index = dataService.getIndex();

			if (!(dataType in index)) {
				return sendErrorResponse(res, 404, 'DATA_TYPE_NOT_FOUND_IN_INDEX');
			}

			sendSuccessResponse(res, index[dataType]);
		});

		this.app.get('/data/:dataType/:name', async (req: Request, res: Response) => {
			const { dataType, name } = req.params;
			let language = typeof req.query.lang === 'string' ? req.query.lang : 'EN';

			if (!isLanguageKey(language)) {
				language = 'EN';
			}

			if (!isDataTypeKey(dataType)) {
				return sendErrorResponse(res, 400, 'INVALID_DATA_TYPE');
			}

			const result = await queryGitHubFile(language, dataType, name);
			result.match(
				(data) => sendSuccessResponse(res, data),
				(error) => sendErrorResponse(res, 404, 'NOT_FOUND')
			);
		});
	}

	async getDataIndex() {
		while (!this.isInitialised) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		return dataService.getIndex();
	}
}
