import axios from 'axios';
import { GithubFile } from '../types/models/github';
import { LanguageKey } from '../types/models/language';
import { DataTypeKey } from '../types/models/fileReference';
import { logToConsole } from './log';
import { GitHubAPIError } from './errors';

/**
 * Queries a specified folder within a GitHub repository for its contents,
 * excluding a specific file named "index.json".
 *
 * @param {LanguageKey} language - The subdirectory within the repository, often used to specify a language or category.
 * @param {DataTypeKey} folder - The name of the folder whose contents are being queried.
 * @returns {Promise<GithubFile[]>} - A promise that resolves to an array of objects,
 *          each containing the `name` and `download_url` of a file within the specified folder.
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
			throw new GitHubAPIError(`Failed to fetch folder contents: ${response.statusText}`);
		}

		return response.data.filter((file: GithubFile) => file.name !== 'index.json');
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logToConsole(
			'Utils',
			`queryGitHubFolder failed for ${language}/${folder}: ${errorMessage}`
		);
		throw new GitHubAPIError(
			`queryGitHubFolder failed for ${language}/${folder}: ${errorMessage}`
		);
	}
};

/**
 * Queries for a specific file within a GitHub repository.
 *
 * @param {LanguageKey} language - The subdirectory within the repository, often used to specify a language or category.
 * @param {string} folder - The name of the folder where the file is located.
 * @param {DataTypeKey} fileName - The name of the file to query, without the `.json` extension.
 * @returns {Promise<object>} - A promise that resolves to the content of the requested file.
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
			throw new GitHubAPIError(`Failed to fetch file: ${response.statusText}`);
		}

		return response.data;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logToConsole(
			'Utils',
			`queryGitHubFile failed for ${language}/${folder}/${fileName}: ${errorMessage}`
		);
		throw new GitHubAPIError(
			`queryGitHubFile failed for ${language}/${folder}/${fileName}: ${errorMessage}`
		);
	}
};
