import axios from 'axios';
import { GithubFile } from '../types/models/github';
import { LanguageKey } from '../types/models/language';
import { DataTypeKey } from '../types/models/fileReference';
import { logToConsole } from './log';
import { err, ok, Result } from 'neverthrow';

/**
 * Queries a specified folder within a GitHub repository for its contents,
 * excluding a specific file named "index.json".
 *
 * @param {LanguageKey} language - The subdirectory within the repository, often used to specify a language or category.
 * @param {DataTypeKey} folder - The name of the folder whose contents are being queried.
 * @returns {Promise<Result<GithubFile[], Error>>} - A promise that resolves to a result object containing either the data or an error message.
 */
export const queryGitHubFolder = async (
	language: LanguageKey,
	folder: DataTypeKey
): Promise<Result<GithubFile[], Error>> => {
	const url = `https://api.github.com/repos/dval-in/dvalin-data/contents/data/${language}/${folder}`;

	try {
		const response = await axios.get<GithubFile[]>(url);
		if (response.status !== 200) {
			logToConsole(
				'Utils',
				`queryGitHubFolder failed for ${language}/${folder}: ${response.statusText}`
			);
			return err(new Error(`Failed to fetch folder contents: ${response.statusText}`));
		}

		const filteredData = response.data.filter((file: GithubFile) => file.name !== 'index.json');
		return ok(filteredData);
	} catch (error) {
		logToConsole('Utils', `queryGitHubFolder failed for ${language}/${folder}: ${error}`);
		return err(new Error('Failed to fetch folder contents'));
	}
};

/**
 * Queries for a specific file within a GitHub repository.
 *
 * @param {LanguageKey} language - The subdirectory within the repository, often used to specify a language or category.
 * @param {string} folder - The name of the folder where the file is located.
 * @param {DataTypeKey} fileName - The name of the file to query, without the `.json` extension.
 * @returns {Promise<Result<object, Error>>} - A promise that resolves to a result object containing either the data or an error message.
 */
export const queryGitHubFile = async (
	language: LanguageKey,
	folder: string,
	fileName: DataTypeKey
): Promise<Result<object, Error>> => {
	const url = `https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/${language}/${folder}/${fileName}.json`;

	try {
		const response = await axios.get(url);
		if (response.status !== 200) {
			logToConsole(
				'Utils',
				`queryGitHubFile failed for ${language}/${folder}/${fileName}: ${response.statusText}`
			);
			return err(new Error(`Failed to fetch file: ${response.statusText}`));
		}

		return ok(response.data);
	} catch (error) {
		logToConsole(
			'Utils',
			`queryGitHubFile failed for ${language}/${folder}/${fileName}: ${error}`
		);
		return err(new Error('Failed to fetch file'));
	}
};
