import { type Express, type Request, type Response } from 'express';
import { sendSuccessResponse } from '../../utils/sendResponse';
import { getGenshinAccountsFromUser, getWishesFromGenshinAccount } from '../../db/user';

export class UserRoute {
	constructor(private readonly app: Express) {}

	setupRoutes(): void {
		this.app.get('/user', async (req: Request, res: Response) => {
			if (req.user === undefined) {
				return;
			}

			const genshinAccount = await getGenshinAccountsFromUser(req.user.providerId);

			const uid = genshinAccount[0].uid;

			const allWishes = await getWishesFromGenshinAccount(uid);

			const BeginnerWishes = allWishes.filter((w) => w.gachaType === '100');
			const StandardWishes = allWishes.filter((w) => w.gachaType === '200');
			const CharacterEventWishes = allWishes.filter((w) => w.gachaType === '301');
			const WeaponEventWishes = allWishes.filter((w) => w.gachaType === '302');
			const ChronicledWishes = allWishes.filter((w) => w.gachaType === '500');

			const a = {
				format: 'dvalin',
				version: 1,
				user: {
					server: 'Europe',
					ar: 60,
					uid: uid,
					wl: 6
				},
				...(allWishes.length > 0
					? {
							wishes: {
								...(WeaponEventWishes.length !== 0
									? { WeaponEvent: WeaponEventWishes }
									: undefined),
								...(StandardWishes.length !== 0
									? { Standard: StandardWishes }
									: undefined),
								...(CharacterEventWishes.length !== 0
									? { CharacterEvent: CharacterEventWishes }
									: undefined),
								...(BeginnerWishes.length !== 0
									? { Beginner: BeginnerWishes }
									: undefined),
								...(ChronicledWishes.length !== 0
									? { Chronicled: ChronicledWishes }
									: undefined)
							}
						}
					: undefined)
			};

			sendSuccessResponse(res, a);
		});
	}
}
