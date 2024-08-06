import { Wish } from '@prisma/client';
import axios from 'axios';
import { Result, ok, err } from 'neverthrow';
import { GachaItem, HoyoWishResponse } from '../../types/models/wish';
import { logToConsole } from '../../utils/log';
import { BKTree } from '../dataStructure/BKTree';
import { convertGachaType } from '../../utils/bannerIdentifier';
import { bannerService } from '../../services/banner.service.ts';

const fetchWishes = async (
	authkey: string,
	gachaType: string,
	endId: string
): Promise<Result<GachaItem[], string>> => {
	const FETCH_URL = 'https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog';
	try {
		const { data } = await axios.get<HoyoWishResponse>(FETCH_URL, {
			params: {
				authkey,
				authkey_ver: 1,
				lang: 'en-us',
				page: 1,
				size: 20,
				end_id: endId,
				gacha_type: gachaType
			}
		});
		return data.retcode === 0 && data.data !== null
			? ok(data.data.list)
			: err('Invalid response from API');
	} catch (error) {
		logToConsole('Utils', `fetchWishes failed for gachaType: ${gachaType}`);
		return err('Failed to fetch wishes');
	}
};

const processWish = (wish: GachaItem, bkTree: BKTree, order: number): Omit<Wish, 'createdAt'> => {
	const name = bkTree.search(wish.name)[0].word;
	const banner = bannerService.getBannerFromTime(
		convertGachaType(wish.gacha_type),
		new Date(wish.time).getTime()
	);
	const isFeatured = banner?.featured.some((key) => key === name);
	const processedWish: Omit<Wish, 'createdAt'> = {
		gachaType: wish.gacha_type === '400' ? '301' : wish.gacha_type,
		time: new Date(wish.time),
		name,
		itemType: wish.item_type,
		rankType: wish.rank_type,
		order,
		genshinWishId: wish.id,
		uid: wish.uid,
		pity: '1',
		wasImported: false,
		bannerId: banner.id,
		isFeatured,
		wonFiftyFifty: false
	};

	return processedWish;
};

export { fetchWishes, processWish };
