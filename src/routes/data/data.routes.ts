import { type Express, type Request, type Response } from 'express';
import { dataService } from '../../services/data.service.ts';
import { queryGitHubFile } from '../../utils/github';
import { logToConsole } from '../../utils/log';
import { sendErrorResponse, sendSuccessResponse } from '../../handlers/response.handler.ts';
import { isDataTypeKey } from '../../types/models/fileReference';
import { isLanguageKey } from '../../types/models/language';

export class DynamicDataRoute {
	public isInitialized: boolean = false;

	constructor(private readonly app: Express) {
		dataService
			.initialize()
			.then(() => {
				logToConsole('Data', 'initialization complete');
				this.isInitialized = true;
			})
			.catch((error) => {
				logToConsole('data', `initialization failed: ${error.message}`);
			});
	}

	setupRoutes(): void {
		this.app.get('/data/:dataType/index', async (req: Request, res: Response) => {
			if (!this.isInitialized) {
				return sendErrorResponse(res, 503, 'NOT_INITIALIZED');
			}

			const { dataType } = req.params;

			if (
				dataType !== 'Character' &&
				dataType !== 'Weapon' &&
				dataType !== 'Banner' &&
				dataType !== 'Achievement'
			) {
				return sendErrorResponse(res, 400, 'INVALID_DATA_TYPE');
			}
			if (dataType === 'Banner') {
				const bannerData = dataService.getBanner();
				if (bannerData === undefined) {
					return sendErrorResponse(res, 404, 'BANNER_DATA_NOT_FOUND');
				} else {
					return sendSuccessResponse(res, bannerData);
				}
			}

			if (dataType === 'Achievement') {
				const achievementData = dataService.getAchievementCategoryList();
				if (achievementData === undefined) {
					return sendErrorResponse(res, 404, 'ACHIEVEMENT_DATA_NOT_FOUND');
				} else {
					return sendSuccessResponse(res, achievementData);
				}
			}
			const index = dataService.getIndex();

			if (!(dataType in index)) {
				return sendErrorResponse(res, 404, 'DATA_TYPE_NOT_FOUND_IN_INDEX');
			} else {
				return sendSuccessResponse(res, index[dataType]);
			}
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

			if (dataType === 'Achievement') {
				// check if name is a valid achievement category
				const validNameList = dataService.getAchievementCategoryList();
				if (!validNameList.includes(name)) {
					return sendErrorResponse(res, 404, 'INVALID_ACHIEVEMENT_CATEGORY');
				}
				return sendSuccessResponse(res, dataService.getAchievement(language, name));
			}

			const result = await queryGitHubFile<object>(language, dataType, name);
			return result.match(
				(data) => sendSuccessResponse(res, data),
				(_error) => sendErrorResponse(res, 404, 'NOT_FOUND')
			);
		});
	}
}
