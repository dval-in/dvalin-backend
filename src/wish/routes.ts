import { type Express, type Request, type Response } from 'express';
import { wishHistoryQueue } from './wishHistoryQueue'; // Adjust the path as necessary
import { getGachaConfigList } from '../utils/hoyolab';

export class WishHistoryRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/wishhistory', async (req: Request, res: Response) => {
			const authkey =
				typeof req.query.authkey === 'string'
					? decodeURIComponent(req.query.authkey)
					: null;
			// const uid = typeof req.query.uid === 'string' ? decodeURIComponent(req.query.uid) : null;
			if (authkey === null || authkey === '') {
				return res.status(400).send('Missing authkey');
			}
			const providerId = req.session.passport.user.providerId;
			const configResponse = await getGachaConfigList(authkey);
			if (configResponse.retcode !== 0 || configResponse.data === null) {
				console.error(
					'[server] Failed to fetch gacha configuration list:',
					configResponse.message
				);
				return res.status(500).send('Failed to fetch gacha configuration list');
			}
			const job = await wishHistoryQueue.add(
				'FETCH_WISH_HISTORY',
				{
					authkey,
					providerId
				},
				{ delay: 5000, removeOnComplete: 100, removeOnFail: 100 }
			);
			res.json({
				jobId: job.id,
				message: 'Your request is being processed. Please check back later for the results.'
			});
		});
	}
}
