import axios from 'axios';
import { Index } from '../types/models/dataIndex';
import { queryGitHubFolder } from '../utils/github';
import { logToConsole } from '../utils/log';

class DataService {
	private readonly index: Index = { Character: {}, Weapon: {} };

	async initialize(): Promise<void> {
		await this.fetchData('Character');
		await this.fetchData('Weapon');
	}

	async fetchData(type: 'Character' | 'Weapon'): Promise<void> {
		const files = await queryGitHubFolder('EN', type);

		if (files === undefined) {
			return logToConsole('dataindex', 'Cant query github');
		}

		for (const file of files.filter((f: { name: string }) => f.name !== 'index.json')) {
			try {
				const fileResponse = await axios.get(file.download_url);
				const data = fileResponse.data;
				try {
					this.index[type][file.name.replace('.json', '')] = {
						name: data.name,
						rarity: data.rarity
					};
				} catch (error) {
					console.error(`[server] missing field in file: ${file.name}`, error);
				}
			} catch (fileError) {
				console.error(`[server] Failed to fetch ${type} file: ${file.name}`);
			}
		}
	}

	getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
