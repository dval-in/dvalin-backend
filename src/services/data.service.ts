import axios from 'axios';
import { Index } from '../types/models/dataIndex';
import { queryGitHubFolder } from '../utils/github';
import { Result, ok, err } from 'neverthrow';
import { logToConsole } from '../utils/log';

class DataService {
	private readonly index: Index = { Character: {}, Weapon: {} };

	async initialize(): Promise<Result<void, Error>> {
		const characterResult = await this.fetchData('Character');
		if (characterResult.isErr()) {
			return err(new Error('Failed to initialize Character data'));
		}

		const weaponResult = await this.fetchData('Weapon');
		if (weaponResult.isErr()) {
			return err(new Error('Failed to initialize Weapon data'));
		}

		return ok(undefined);
	}

	async fetchData(type: 'Character' | 'Weapon'): Promise<Result<void, Error>> {
		const filesResult = await queryGitHubFolder('EN', type);
		if (filesResult.isErr()) {
			return err(new Error(`Cannot query GitHub folder for ${type}`));
		}

		const files = filesResult.value;
		for (const file of files.filter((f: { name: string }) => f.name !== 'index.json')) {
			try {
				const fileResponse = await axios.get(file.download_url);
				const data = fileResponse.data;

				this.index[type][file.name.replace('.json', '')] = {
					name: data.name,
					rarity: data.rarity
				};
			} catch (fileError) {
				logToConsole(
					`DataService`,
					`[server] Failed to fetch ${type} file: ${file.name}` + fileError
				);
				return err(new Error(`Failed to fetch ${type} file: ${file.name}`));
			}
		}
		return ok(undefined);
	}

	getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
