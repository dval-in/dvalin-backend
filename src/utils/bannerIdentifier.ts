import axios from 'axios';
import { logToConsole } from './log';
import { bannerdata } from '../worker/bannerDataWorker';

export const getBannerData = async (): Promise<Banners | undefined> => {
	try {
		const response = await axios.get(
			`https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/EN/banners.json`
		);

		if (response.status !== 200) {
			return undefined;
		}

		return response.data as Banners;
	} catch (e) {
		logToConsole('Utils', `queryGitHubFile failed for banner file`);
		return undefined;
	}
};

export const getBannerId(time: String) => String {
	bannerdata.key
}
