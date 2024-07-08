import axios from 'axios';
import { Index } from '../types/models/dataIndex';
import { queryGitHubFolder } from '../utils/github';
import { Result, ok, err } from 'neverthrow';
import { logToConsole } from '../utils/log';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from '../config/config';

class DataService {
	private readonly index: Index = { Character: {}, Weapon: {}, AchievementCategory: {} };

	async initialize(): Promise<Result<void, Error>> {
		const characterResult = await this.fetchData('Character');
		if (characterResult.isErr()) {
			return err(new Error('Failed to initialize Character data'));
		}

		const weaponResult = await this.fetchData('Weapon');
		if (weaponResult.isErr()) {
			return err(new Error('Failed to initialize Weapon data'));
		}

		const achievementCategoryResult = await this.fetchData('AchievementCategory');
		if (achievementCategoryResult.isErr()) {
			return err(new Error('Failed to initialize AchievementCategory data'));
		}
		return ok(undefined);
	}

	async fetchData(
		type: 'Character' | 'Weapon' | 'AchievementCategory'
	): Promise<Result<void, Error>> {
		const isDev = config.DEBUG;
		try {
			let files;
			if (isDev) {
				const dirPath = join(config.DEBUG_DATA_DIR, type);
				files = await readdir(dirPath);
				files = files.map((name) => ({ name, download_url: join(dirPath, name) }));
			} else {
				const filesResult = await queryGitHubFolder('EN', type);
				if (filesResult.isErr()) {
					return err(new Error(`Cannot query GitHub folder for ${type}`));
				}
				files = filesResult.value;
			}

			for (const file of files.filter((f) => f.name !== 'index.json')) {
				try {
					let data;
					if (isDev) {
						const fileContent = await readFile(file.download_url, 'utf-8');
						data = JSON.parse(fileContent);
					} else {
						const fileResponse = await axios.get(file.download_url);
						data = fileResponse.data;
					}
					if (type === 'Weapon' || type === 'Character') {
						this.index[type][file.name.replace('.json', '')] = {
							name: data.name,
							rarity: data.rarity,
							element: data.element,
							weaponType: data.weaponType
						};
					} else {
						this.index[type][file.name.replace('.json', '')] = {
							name: data.name,
							order: data.order,
							total: data.achievements.length
						};
					}
				} catch (fileError: any) {
					logToConsole(
						`DataService`,
						`[server] Failed to fetch ${type} file: ${file.name}` + fileError
					);
					return err(new Error(`Failed to fetch ${type} file: ${file.name}`));
				}
			}
			return ok(undefined);
		} catch (error) {
			return err(new Error(`Error in fetchData: ${error}`));
		}
	}

	getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
