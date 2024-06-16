import { Response } from 'express';
import { config } from '../config/config';

export const sendErrorResponse = (res: Response, status: number, state: string) => {
	res.status(status).json({
		state: state
	});
};

export const sendSuccessResponse = (res: Response, data: object) => {
	const responseData = !config.DEBUG ? removeIds(data) : data;
	res.status(200).json(responseData);
};

const removeIds = (data: any): object | [] => {
	const filteredData: any = {};
	if (Array.isArray(data)) {
		return data.map((item) => removeIds(item));
	}
	for (const key in data) {
		if (key.startsWith('id') || key.includes('Id')) {
			filteredData.id = 'REDACTED';
		} else {
			if (
				Array.isArray(data[key]) ||
				(typeof data[key] === 'object' && !(data[key] instanceof Date))
			) {
				filteredData[key] = removeIds(data[key]);
				continue;
			}
			filteredData[key] = data[key];
		}
	}
	return filteredData;
};
