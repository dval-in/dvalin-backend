import axios from 'axios';
import { GithubFile } from '../types/github';
import { LanguageKey } from '../types/language';
import { DataTypeKey } from '../types/fileReference';
import { logToConsole } from './log';

/**
 * Queries a specified folder within a GitHub repository for its contents,
 * excluding a specific file named "index.json".
 *
 * @param {string} language The subdirectory within the repository, often used to specify a language or category.
 * @param {string} folder The name of the folder whose contents are being queried.
 * @returns {Promise<{name: string, download_url: string}[]>} A promise that resolves to an array of objects,
 *          each containing the `name` and `download_url` of a file within the specified folder.
 * @throws {Error} Throws an error if the query to GitHub fails.
 */
export const queryGitHubFolder = async (
	language: LanguageKey,
	folder: DataTypeKey
): Promise<GithubFile[] | undefined> => {
	try {
		const response = await axios.get<GithubFile[]>(
			`https://api.github.com/repos/dval-in/dvalin-data/contents/data/${language}/${folder}`
		);

		if (response.status !== 200) {
			return undefined;
		}

		return response.data.filter((file: GithubFile) => file.name !== 'index.json');
	} catch (e) {
		logToConsole('Utils', `queryGitHubFolder failed for ${language}/${folder}`);
		return undefined;
	}
};

/**
 * Queries for a specific file within a GitHub repository.
 *
 * @param {string} language The subdirectory within the repository, often used to specify a language or category.
 * @param {string} folder The name of the folder where the file is located.
 * @param {string} fileName The name of the file to query, without the `.json` extension.
 * @returns {Promise<any>} A promise that resolves to the content of the requested file.
 * @throws {Error} Throws an error if the query to GitHub fails.
 */
export const queryGitHubFile = async (
	language: LanguageKey,
	folder: string,
	fileName: DataTypeKey
): Promise<object | undefined> => {
	try {
		const response = await axios.get(
			`https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/${language}/${folder}/${fileName}.json`
		);

		if (response.status !== 200) {
			return undefined;
		}

		return response.data;
	} catch (e) {
		logToConsole('Utils', `queryGitHubFile failed for ${language}/${folder}/${fileName}`);
		return undefined;
	}
};
