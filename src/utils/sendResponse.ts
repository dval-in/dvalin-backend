import { Response } from 'express';

export const sendErrorResponse = (res: Response, status: number, state: string) => {
	res.status(status).json({
		state: state
	});
};

export const sendSuccessResponse = (res: Response, data: object) => {
	res.status(200).json(data);
};
