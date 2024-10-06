import { err, ok } from 'neverthrow';
import { logToConsole } from './log';
import { pullAllFilesFromFolder } from './github';
import { LanguageKey, languageList } from '../types/models/language';
import { AchievementCategory, AchievementExtraData } from 'dvalin-data';
import { mergedAchievements } from 'types/models/achievements';

/**
 * lang -> achievement file -> file content
 * @returns {Promise<Result<{ [key: LanguageKey]: Record<string, mergedAchievements> }, Error>>} - A promise that resolves to a result object containing either the data or an error message.
 */
export const getAchievementCategories = async () => {
	const achievementCategoriesResult = await pullAllFilesFromFolder<
		AchievementCategory | AchievementExtraData
	>('EN', 'AchievementCategory');

	if (achievementCategoriesResult.isErr()) {
		logToConsole(
			'Utils',
			`Failed to fetch achievement categories for EN: ${achievementCategoriesResult.error}`,
			'error'
		);
		return err(new Error('Failed to fetch achievement categories'));
	}

	const allCategories = achievementCategoriesResult.value;
	const baseCategoriesEN: Record<string, AchievementCategory> = {};
	const extraCategories: Record<string, AchievementExtraData> = {};

	for (const [filename, category] of Object.entries(allCategories)) {
		if (filename.endsWith('Extra')) {
			const baseName = filename.replace('Extra', '');
			extraCategories[baseName] = category as AchievementExtraData;
		} else {
			const baseName = filename;
			baseCategoriesEN[baseName] = category as AchievementCategory;
		}
	}
	const mergedCategoriesEN: Record<string, mergedAchievements> = {};
	for (const [baseName, baseCategory] of Object.entries(baseCategoriesEN)) {
		const extraData = extraCategories[baseName];
		mergedCategoriesEN[baseName] = mergeAchievementData(baseCategory, extraData);
	}
	const achievementCategories: { [key: LanguageKey]: Record<string, mergedAchievements> } = {
		EN: mergedCategoriesEN
	};
	for (const language of languageList) {
		if (language === 'EN') {
			continue;
		}
		const baseCategories = await pullAllFilesFromFolder<AchievementCategory>(
			language.replace('-', ''),
			'AchievementCategory'
		);
		if (baseCategories.isErr()) {
			logToConsole(
				'Utils',
				`Failed to fetch achievement categories for ${language}: ${baseCategories.error}`,
				'error'
			);
			return err(new Error('Failed to fetch achievement categories'));
		}

		const baseCategoriesData = baseCategories.value;
		const mergedCategories: Record<string, mergedAchievements> = {};
		for (const [baseName, baseCategory] of Object.entries(baseCategoriesData)) {
			const extraData = extraCategories[baseName];
			mergedCategories[baseName] = mergeAchievementData(baseCategory, extraData);
		}
		achievementCategories[language] = mergedCategories;
	}
	return ok(achievementCategories);
};

function mergeAchievementData(file1: AchievementCategory, extra: AchievementExtraData) {
	const mergedAchievements = file1.achievements.map((achievement) => {
		const matchingData = extra.find((data) => data.id === achievement.id);
		return {
			...achievement,
			requirements: matchingData?.requirements ?? '',
			requirementQuestLink: matchingData?.requirementQuestLink ?? '',
			hidden: matchingData?.hidden ?? '',
			type: matchingData?.type ?? '',
			version: matchingData?.version ?? '',
			steps: matchingData?.steps ?? ''
		};
	});

	return {
		...file1,
		achievements: mergedAchievements
	};
}
