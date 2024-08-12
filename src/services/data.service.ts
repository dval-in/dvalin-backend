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
import { syncUserProfileQueue } from '../queues/syncUserProfile.queue.ts';
import { wishQueue } from '../queues/wish.queue.ts';
import { getBannerData } from '../utils/bannerIdentifier';
import { Banner, BannerKeyType } from '../types/frontend/banner';

interface FileInfo {
	name: string;
	download_url: string;
}

class DataService {
	private index: Index = { Character: {}, Weapon: {} };
	private bkTree: BKTree = new BKTree(optimizedFuzzyLCS);
	private bannerData: Banner[] = undefined;

	async initialize(): Promise<Result<void, Error>> {
		const indexResult = await this.buildIndex();
		if (indexResult.isErr()) {
			return err(indexResult.error);
		}
		this.index = indexResult.value;
		const indexes = [...Object.keys(this.index.Character), ...Object.keys(this.index.Weapon)];
		indexes.forEach((key) => this.bkTree.insert(key));
		const dataResult = await getBannerData();
		if (dataResult.isOk()) {
			this.bannerData = dataResult.value;
			return ok(undefined);
		} else {
			return err(dataResult.error);
		}
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

	public refreshData = async () => {
		Promise.all([this.buildIndex(), getBannerData()]).then(async (result) => {
			const bannerResult = result[1];
			if (bannerResult.isErr()) {
				return err(bannerResult.error);
			}
			const newBanners = bannerResult.value;
			const indexResult = result[0];
			const newBKTree = new BKTree(optimizedFuzzyLCS);
			if (indexResult.isErr()) {
				return err(indexResult.error);
			}
			const newIndex = indexResult.value;
			const indexes = [...Object.keys(newIndex.Character), ...Object.keys(newIndex.Weapon)];
			indexes.forEach((key) => newBKTree.insert(key));
			// pause all services and put the server in standby
			syncUserProfileQueue.pause();
			wishQueue.pause();
			// wait for all services to finish their current jobs
			while (
				(await syncUserProfileQueue.getActiveCount()) > 0 &&
				(await wishQueue.getActiveCount()) > 0
			) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
			// refresh the services with the new data
			this.index = newIndex;
			this.bkTree = newBKTree;
			this.bannerData = newBanners;

			// resume the services
			syncUserProfileQueue.resume();
			wishQueue.resume();
			return ok(undefined);
		});
	};

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

	public getBanner = (): Banner[] => {
		return this.bannerData;
	};

	public getBannerFromTime = (bannerType: BannerKeyType, timestamp: number): Banner => {
		const found = this.bannerData.find((banner) => {
			return (
				banner.type === bannerType &&
				banner.startDuration.getTime() <= timestamp &&
				banner.duration.getTime() >= timestamp
			);
		});

		if (!found) {
			return this.bannerData.find((banner) => banner.type === 'Permanent');
		}
		return found;
	};
	public getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
