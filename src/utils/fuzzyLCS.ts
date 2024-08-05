/**
 * Calculates a fuzzy Longest Common Subsequence (LCS) similarity between two strings.
 * This implementation is more tolerant of minor differences and typos.
 *
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @param {number} fuzzyMatchThreshold - The threshold for considering characters as a match (0-1, default 0.8).
 * @returns {number} - The fuzzy LCS similarity score (0-1).
 */
const fuzzyLCS = (s1: string, s2: string): number => {
	const m = s1.length;
	const n = s2.length;
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (isFuzzyMatch(s1[i - 1], s2[j - 1])) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Normalize the score
	return dp[m][n] / Math.max(m, n);
};

/**
 * Determines if two characters are a fuzzy match based on a similarity threshold.
 *
 * @param {string} c1 - The first character.
 * @param {string} c2 - The second character.
 * @param {number} threshold - The similarity threshold for considering a match.
 * @returns {boolean} - True if the characters are considered a fuzzy match, false otherwise.
 */
const isFuzzyMatch = (c1: string, c2: string): boolean => {
	if (c1 === c2) {
		return true;
	}

	// Consider case-insensitive matches
	if (c1.toLowerCase() === c2.toLowerCase()) {
		return true;
	}

	// Consider similar-looking characters - shouldnt be a thing BUT might happen with some manual import or smth
	const similarChars: { [key: string]: string[] } = {
		l: ['1', 'i'],
		a: ['e', '@'],
		e: ['a', '3'],
		i: ['1', 'l'],
		o: ['0'],
		s: ['5', '$'],
		t: ['7'],
		b: ['6', '8'],
		g: ['9'],
		z: ['2']
	};

	if (
		similarChars[c1.toLowerCase()]?.includes(c2.toLowerCase()) ||
		similarChars[c2.toLowerCase()]?.includes(c1.toLowerCase())
	) {
		return true;
	}

	return false;
};

/**
 * Calculates the fuzzy LCS similarity between two strings and converts it to a distance metric.
 *
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @param {number} minSimilarityThreshold - The minimum similarity threshold for considering strings similar (0-1, default 0.7).
 * @returns {number} - The fuzzy distance (integer), or a large number if below the minimum threshold.
 */
const optimizedFuzzyLCS = (
	s1: string,
	s2: string,
	minSimilarityThreshold: number = 0.7
): number => {
	// Early exit if the length difference is too large
	const maxLengthDiff = Math.max(s1.length, s2.length) * (1 - minSimilarityThreshold);
	console.log(maxLengthDiff);
	if (Math.abs(s1.length - s2.length) > maxLengthDiff) {
		return Math.max(s1.length, s2.length);  // Return max length as a large distance
	}

	const similarity = fuzzyLCS(s1, s2);
	console.log(similarity);
	if (similarity < minSimilarityThreshold) {
		return Math.max(s1.length, s2.length);  // Return max length as a large distance
	}

	// Convert similarity to distance (0 means identical, larger numbers mean more different)
	return Math.round((1 - similarity) * Math.max(s1.length, s2.length));
};

export { optimizedFuzzyLCS };
