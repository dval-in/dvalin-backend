import axios from 'axios';
import { AchievementItem, CharacterItem, Index, WeaponItem } from '../types/models/dataIndex';
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
import { Banner, BannerData } from '../types/models/banner.ts';
import { WishKeyBanner } from '../types/frontend/wish.ts';
import { LanguageKey } from 'types/models/language.ts';
import { getAchievementCategories } from 'utils/achievementBuilder.ts';
import { mergedAchievements } from 'types/models/achievements.ts';
import { GithubFile } from 'types/models/github.ts';

class DataService {
	private index: Index = { Character: {}, Weapon: {}, AchievementCategory: {} };
	private bkTree: BKTree = new BKTree(optimizedFuzzyLCS);
	private bannerData: BannerData = undefined;
	private achievementData: { [key: LanguageKey]: Record<string, mergedAchievements> } = {};

	async initialize(): Promise<Result<void, Error>> {
		//*********************************CHAR & WEAPON INDEX PART ************************************** */
		const indexResult = await this.buildIndex();
		if (indexResult.isErr()) {
			return err(indexResult.error);
		}
		this.index = indexResult.value;
		const indexes = [
			...Object.keys(this.index.Character),
			...Object.keys(this.index.Weapon),
			...Object.keys(this.index.AchievementCategory)
		];
		indexes.forEach((key) => this.bkTree.insert(key));

		//*********************************BANNER PART ************************************** */
		const dataResult = await getBannerData();
		if (dataResult.isErr()) {
			return err(dataResult.error);
		}
		this.bannerData = dataResult.value;

		//*********************************ACHIEVEMENT PART ************************************** */
		const achievementResult = await getAchievementCategories();
		if (achievementResult.isErr()) {
			return err(achievementResult.error);
		}
		this.achievementData = achievementResult.value;
		return ok(undefined);
	}

	public async buildIndex(): Promise<Result<Index, Error>> {
		const characterResult = await this.tryFetchData('Character');
		if (characterResult.isErr()) {
			return err(new Error('Failed to initialize Character data'));
		}

		const weaponResult = await this.tryFetchData('Weapon');
		if (weaponResult.isErr()) {
			return err(new Error('Failed to initialize Weapon data'));
		}

		const achievementResult = await this.tryFetchData('AchievementCategory');
		if (achievementResult.isErr()) {
			console.log(achievementResult.error);
			return err(new Error('Failed to initialize Achievement data'));
		}

		return ok({
			Character: characterResult.value.Character,
			Weapon: weaponResult.value.Weapon,
			AchievementCategory: achievementResult.value.AchievementCategory
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
		type: 'Character' | 'Weapon' | 'AchievementCategory'
	): Promise<Result<Index, Error>> {
		try {
			const files = config.DEBUG
				? await this.getDevFiles(type)
				: await this.getProdFiles(type);
			if (files.isErr()) {
				return err(files.error);
			}

			return await this.processFiles(type, files.value);
		} catch (error) {
			return err(
				new Error(
					`Error in fetchData: ${error instanceof Error ? error.message : String(error)}`
				)
			);
		}
	}

	private async getDevFiles(
		type: 'Character' | 'Weapon' | 'AchievementCategory'
	): Promise<Result<GithubFile[], Error>> {
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

	private async getProdFiles(
		type: 'Character' | 'Weapon' | 'AchievementCategory'
	): Promise<Result<GithubFile[], Error>> {
		const filesResult = await queryGitHubFolder('EN', type);
		if (filesResult.isErr()) {
			return err(new Error(`Cannot query GitHub folder for ${type}`));
		}
		return ok(filesResult.value);
	}

	private async processFiles(
		type: 'Character' | 'Weapon' | 'AchievementCategory',
		files: GithubFile[]
	): Promise<Result<Index, Error>> {
		let index: Index = { Character: {}, Weapon: {}, AchievementCategory: {} };

		for (const file of files.filter((f) => f.name !== 'index.json')) {
			if (!(type === 'AchievementCategory' && file.name.includes('Extra'))) {
				const fileData = await this.getFileData(file);
				const processResult = this.processFile(type, fileData);

				if (processResult.isErr()) {
					return err(processResult.error);
				}

				index[type][file.name.replace('.json', '')] = processResult.value;
			}
		}

		return ok(index);
	}

	private processFile(type: 'Character' | 'Weapon' | 'AchievementCategory', file: any) {
		try {
			switch (type) {
				case 'Character':
					return ok({
						name: file.name,
						rarity: file.rarity,
						element: file.element,
						weaponType: file.weaponType
					});
				case 'Weapon':
					return ok({
						name: file.name,
						rarity: file.rarity,
						type: file.type
					});
				case 'AchievementCategory':
					return ok({
						name: file.name,
						order: file.order,
						totalAchievementCount:
							file.achievements === undefined ? 0 : file.achievements.length
					});
			}
		} catch (fileError) {
			logToConsole(
				`DataService`,
				`[server] Failed to fetch ${type} file: ${file.name}` + fileError
			);
			return err(new Error(`Failed to fetch ${type} file: ${file.name}`));
		}
	}

	private async getFileData(file: GithubFile) {
		if (config.DEBUG) {
			const fileContent = await readFile(file.download_url, 'utf-8');

			return JSON.parse(fileContent) as CharacterItem | WeaponItem | AchievementItem;
		} else {
			const fileResponse = await axios.get<CharacterItem | WeaponItem | AchievementItem>(
				file.download_url
			);

			return fileResponse.data;
		}
	}

	public getBanner = (): BannerData => {
		return this.bannerData;
	};

	public getAchievementCategoryList = () => {
		return Object.keys(this.achievementData['EN']);
	};

	public getAchievement = (language: LanguageKey, category: string): mergedAchievements => {
		return this.achievementData[language][category];
	};

	public getBannerFromTime = (
		bannerType: WishKeyBanner,
		timestamp: number
	): Banner | undefined => {
		const searchBanner = (ignoreTime: boolean = false) => {
			switch (bannerType) {
				case '301':
				case '400': {
					const banners = this.bannerData['301'].filter((banner) => {
						const startTime = ignoreTime
							? this.stripTime(banner.startDuration.getTime())
							: banner.startDuration.getTime();
						const endTime = ignoreTime
							? this.stripTime(banner.duration.getTime())
							: banner.duration.getTime();
						const searchTime = ignoreTime ? this.stripTime(timestamp) : timestamp;
						return startTime <= searchTime && endTime >= searchTime;
					});
					if (bannerType === '400') {
						return banners[1];
					}
					return banners[0];
				}
				default:
					return this.bannerData[bannerType].find((banner) => {
						const startTime = ignoreTime
							? this.stripTime(banner.startDuration.getTime())
							: banner.startDuration.getTime();
						const endTime = ignoreTime
							? this.stripTime(banner.duration.getTime())
							: banner.duration.getTime();
						const searchTime = ignoreTime ? this.stripTime(timestamp) : timestamp;
						return startTime <= searchTime && endTime >= searchTime;
					});
			}
		};

		// First attempt with exact time
		let result = searchBanner(false);

		// If no banner found, try again ignoring the time
		if (!result) {
			result = searchBanner(true);
		}

		return result;
	};

	// Helper function to strip time from a timestamp
	private stripTime = (timestamp: number): number => {
		const date = new Date(timestamp);
		return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	};

	public getIndex(): Index {
		return this.index;
	}
}

export const dataService = new DataService();
