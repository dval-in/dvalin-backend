import axios from 'axios';
import { CharacterItem, Index, WeaponItem } from '../types/models/dataIndex';
import { queryGitHubFolder } from '../utils/github';
import { Result, ok, err } from 'neverthrow';
import { logToConsole } from '../utils/log';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from '../config/config';
import { BKTree } from '../handlers/dataStructure/BKTree';
import { optimizedFuzzyLCS } from '../utils/fuzzyLCS';

interface FileInfo {
	name: string;
	download_url: string;
}

class DataService {
	private index: Index = { Character: {}, Weapon: {} };
	private bkTree: BKTree = new BKTree(optimizedFuzzyLCS);

	async initialize(): Promise<Result<void, Error>> {
		const indexResult = await this.buildIndex();
		if (indexResult.isErr()) {
			return err(indexResult.error);
		}
		this.index = indexResult.value;
		const indexes = [...Object.keys(this.index.Character), ...Object.keys(this.index.Weapon)];
		indexes.forEach((key) => this.bkTree.insert(key));
		return ok(undefined);
	}

	public async buildIndex(): Promise<Result<Index, Error>> {
		const characterResult = await this.tryFetchData('Character', config.DEBUG);
		if (characterResult.isErr()) {
			return err(new Error('Failed to initialize Character data'));
		}
		const weaponResult = await this.tryFetchData('Weapon', config.DEBUG);
		if (weaponResult.isErr()) {
			return err(new Error('Failed to initialize Weapon data'));
		}
		return ok({
			Character: characterResult.value.Character,
			Weapon: weaponResult.value.Weapon
		});
	}

	refresh(bktree: BKTree, index: Index): void {
		this.bkTree = bktree;
		this.index = index;
	}

	public getBKTree(): BKTree {
		return this.bkTree;
	}

	private async tryFetchData(
		type: 'Character' | 'Weapon',
		isDev: boolean
	): Promise<Result<Index, Error>> {
		try {
			const files = isDev ? await this.getDevFiles(type) : await this.getProdFiles(type);
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

	private async getDevFiles(type: 'Character' | 'Weapon'): Promise<Result<FileInfo[], Error>> {
		const dirPath = join('../dvalin-data/data/EN', type);
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
	): Promise<Result<Index, Error>> {
		let processResult;
		for (const file of files.filter((f) => f.name !== 'index.json')) {
			processResult = await this.processFile(type, file, isDev);
			if (processResult.isErr()) {
				return processResult;
			}
		}
		return ok(processResult.value);
	}

	private async processFile(
		type: 'Character' | 'Weapon',
		file: FileInfo,
		isDev: boolean
	): Promise<Result<Index, Error>> {
		try {
			const data = await this.getFileData(file, isDev);
			const result = this.createTypeIndex(type, file.name, data);
			return ok(result);
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

	private createTypeIndex(
		type: 'Character' | 'Weapon',
		fileName: string,
		data: CharacterItem | WeaponItem
	): Index {
		const tempIndex = { Character: {}, Weapon: {} };
		tempIndex[type][fileName.replace('.json', '')] = {
			name: data.name,
			rarity: data.rarity,
			element: 'element' in data ? data.element : undefined, // only on characters
			weaponType: 'weaponType' in data ? data.weaponType : data.type, // only on characters
			type: 'type' in data ? data.type : undefined // only on weapons
		};
		return tempIndex;
	}

	getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
