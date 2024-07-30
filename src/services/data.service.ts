import axios from 'axios';
import { CharacterItem, Index, WeaponItem } from '../types/models/dataIndex';
import { queryGitHubFolder } from '../utils/github';
import { Result, ok, err } from 'neverthrow';
import { logToConsole } from '../utils/log';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from '../config/config';

interface FileInfo {
	name: string;
	download_url: string;
}

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
		const isDev = config.DEBUG;
		return this.tryFetchData(type, isDev);
	}

	private async tryFetchData(
		type: 'Character' | 'Weapon',
		isDev: boolean
	): Promise<Result<void, Error>> {
		try {
			const files = await this.getFiles(type, isDev);
			if (files.isErr()) {
				return err(files.error);
			}

			return await this.processFiles(type, files.value, isDev);
		} catch (error) {
			return err(
				new Error(
					`Error in fetchData: ${error instanceof Error ? error.message : String(error)}`
				)
			);
		}
	}

	private async getFiles(
		type: 'Character' | 'Weapon',
		isDev: boolean
	): Promise<Result<FileInfo[], Error>> {
		if (isDev) {
			return this.getDevFiles(type);
		}
		return await this.getProdFiles(type);
	}

	private async getDevFiles(type: 'Character' | 'Weapon'): Promise<Result<FileInfo[], Error>> {
		const dirPath = join('/Users/jervis/Desktop/Loisir/Informatique/dvalin-data/data/EN', type);
		try {
			const files = await readdir(dirPath);
			return ok(files.map((name) => ({ name, download_url: join(dirPath, name) })));
		} catch (error) {
			return err(
				new Error(
					`Cannot read directory for ${type}: ${error instanceof Error ? error.message : String(error)}`
				)
			);
		}
	}

	private async getProdFiles(type: 'Character' | 'Weapon'): Promise<Result<FileInfo[], Error>> {
		const filesResult = await queryGitHubFolder('EN', type);
		if (filesResult.isErr()) {
			return err(new Error(`Cannot query GitHub folder for ${type}`));
		}
		return ok(filesResult.value);
	}

	private async processFiles(
		type: 'Character' | 'Weapon',
		files: FileInfo[],
		isDev: boolean
	): Promise<Result<void, Error>> {
		for (const file of files.filter((f) => f.name !== 'index.json')) {
			const processResult = await this.processFile(type, file, isDev);
			if (processResult.isErr()) {
				return processResult;
			}
		}
		return ok(undefined);
	}

	private async processFile(
		type: 'Character' | 'Weapon',
		file: FileInfo,
		isDev: boolean
	): Promise<Result<void, Error>> {
		try {
			const data = await this.getFileData(file, isDev);
			this.updateIndex(type, file.name, data);
			return ok(undefined);
		} catch (fileError) {
			logToConsole(
				`DataService`,
				`[server] Failed to fetch ${type} file: ${file.name}` + fileError
			);
			return err(new Error(`Failed to fetch ${type} file: ${file.name}`));
		}
	}

	private async getFileData(file: FileInfo, isDev: boolean): Promise<CharacterItem | WeaponItem> {
		if (isDev) {
			const fileContent = await readFile(file.download_url, 'utf-8');
			return JSON.parse(fileContent) as CharacterItem | WeaponItem;
		}
		const fileResponse = await axios.get<CharacterItem | WeaponItem>(file.download_url);
		return fileResponse.data;
	}

	private updateIndex(
		type: 'Character' | 'Weapon',
		fileName: string,
		data: CharacterItem | WeaponItem
	): void {
		this.index[type][fileName.replace('.json', '')] = {
			name: data.name,
			rarity: data.rarity,
			element: 'element' in data ? data.element : undefined,
			weaponType: 'weaponType' in data ? data.weaponType : data.type,
			type: 'type' in data ? data.type : undefined
		};
	}

	getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
