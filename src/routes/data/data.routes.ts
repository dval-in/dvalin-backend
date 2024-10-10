import { type Express, type Request, type Response } from 'express';
import { dataService } from '../../services/data.service.ts';
import { queryGitHubFile } from '../../utils/github';
import { logToConsole } from '../../utils/log';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler.ts';
import { isDataTypeKey } from '../../types/models/fileReference';
import { isLanguageKey } from '../../types/models/language';

export class DynamicDataRoute {
	private initializationPromise: Promise<void>;
	public isInitialized = false;

	constructor(private readonly app: Express) {
		this.initializationPromise = this.initialize();
	}

	private async initialize(): Promise<void> {
		const result = await dataService.initialize();
		if (result.isErr()) {
			logToConsole('data', `initialization failed: ${result.error.message}`);
			throw result.error;
		}
		this.isInitialized = true;
		logToConsole('Data', 'initialization complete');
	}

	setupRoutes(): void {
		this.app.get('/data/:dataType/index', async (req: Request, res: Response) => {
			if (!this.isInitialized) return;
			let language = typeof req.query.lang === 'string' ? req.query.lang : 'EN';
			if (!isLanguageKey(language)) {
				language = 'EN';
			}

			const { dataType } = req.params;

			if (!['Character', 'Weapon', 'Banner', 'Achievement'].includes(dataType)) {
				return sendErrorResponse(res, 400, 'INVALID_DATA_TYPE');
			}

			if (dataType === 'Banner') {
				const bannerData = dataService.getBanner();
				return bannerData
					? sendSuccessResponse(res, bannerData)
					: sendErrorResponse(res, 404, 'BANNER_DATA_NOT_FOUND');
			}

			if (dataType === 'Achievement') {
				const achievementData = dataService.getAchievementCategoryList();
				return achievementData
					? sendSuccessResponse(res, achievementData)
					: sendErrorResponse(res, 404, 'ACHIEVEMENT_DATA_NOT_FOUND');
			}

			const index = dataService.getIndex(language);
			return dataType in index
				? sendSuccessResponse(res, index[dataType])
				: sendErrorResponse(res, 404, 'DATA_TYPE_NOT_FOUND_IN_INDEX');
		});

		this.app.get('/data/:dataType/:name', async (req: Request, res: Response) => {
			if (!this.isInitialized) return;

			const { dataType, name } = req.params;
			let language = typeof req.query.lang === 'string' ? req.query.lang : 'EN';

			if (!isLanguageKey(language)) {
				language = 'EN';
			}
			if (!isDataTypeKey(dataType)) {
				return sendErrorResponse(res, 400, 'INVALID_DATA_TYPE');
			}

			if (dataType === 'Achievement') {
				const validNameList = dataService.getAchievementCategoryList();
				return validNameList.includes(name)
					? sendSuccessResponse(res, dataService.getAchievement(language, name))
					: sendErrorResponse(res, 404, 'INVALID_ACHIEVEMENT_CATEGORY');
			}

			const result = await queryGitHubFile<object>(language, dataType, name);
			return result.match(
				(data) => sendSuccessResponse(res, data),
				(_error) => sendErrorResponse(res, 404, 'NOT_FOUND')
			);
		});
	}
}
