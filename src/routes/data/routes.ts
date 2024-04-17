import { type Express, type Request, type Response } from 'express';
import { DataIndex } from './dataIndex';
import { queryGitHubFile } from '../../utils/github';
import { logToConsole } from '../../utils/log';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/sendResponse';
import { isDataTypeKey } from '../../types/fileReference';
import { isLanguageKey } from '../../types/language';

export class DynamicDataRoute {
	public isInitialised: boolean = false;
	private readonly dataIndex: DataIndex;

	constructor(private readonly app: Express) {
		this.dataIndex = new DataIndex();
		this.dataIndex
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

			const index = this.dataIndex.getIndex();

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

			const data = await queryGitHubFile(language, dataType, name);

			if (data === undefined) {
				return sendErrorResponse(res, 404, 'NOT_FOUND');
			}

			sendSuccessResponse(res, data);
		});
	}
}
