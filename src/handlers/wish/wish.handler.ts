import { Wish } from '@prisma/client';
import axios from 'axios';
import { Result, ok, err } from 'neverthrow';
import { GachaItem, HoyoWishResponse } from '../../types/models/wish';
import { logToConsole } from '../../utils/log';
import { BKTree } from '../dataStructure/BKTree';

const fetchWishes = async (
	authkey: string,
	gachaType: string,
	endId: string
): Promise<Result<GachaItem[], string>> => {
	const FETCH_URL = 'https://hk4e-api-os.mihoyo.com/gacha_info/api/getGachaLog';
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

const processWish = (
	wish: GachaItem,
	bkTree: BKTree,
	pityCounter: {
		fourStar: number;
		fiveStar: number;
	}
): Omit<Wish, 'createdAt'> => {
	pityCounter.fourStar++;
	pityCounter.fiveStar++;

	const processedWish: Omit<Wish, 'createdAt'> = {
		gachaType: wish.gacha_type,
		time: new Date(wish.time),
		name: bkTree.search(wish.name)[0].word,
		itemType: wish.item_type,
		rankType: wish.rank_type,
		id: wish.id,
		uid: wish.uid,
		pity: '1',
		wasImported: false
	};

	if (wish.rank_type === '4') {
		processedWish.pity = pityCounter.fourStar.toString();
		pityCounter.fourStar = 0;
	} else if (wish.rank_type === '5') {
		processedWish.pity = pityCounter.fiveStar.toString();
		pityCounter.fiveStar = 0;
	}

	return processedWish;
};

export { fetchWishes, processWish };
