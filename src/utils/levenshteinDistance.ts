/**
 * Calculates the Levenshtein distance between two strings with an optimized approach.
 * Early exits if the difference in lengths is greater than the maximum allowed edit distance.
 *
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @param {number} maxDistanceAllowed - The maximum allowed edit distance (default is 3).
 * @returns {number} - The Levenshtein distance between the two strings.
 */
const optimizedLevenshteinDistance = (s1: string, s2: string, maxDistanceAllowed = 3): number => {
	if (Math.abs(s1.length - s2.length) > maxDistanceAllowed) {
		return Math.abs(s1.length - s2.length);
	}

	if (s1.length > s2.length) {
		[s1, s2] = [s2, s1];
	}

	let previousRow = Array(s1.length + 1)
		.fill(undefined)
		.map((_, i) => i);
	let currentRow = new Array(s1.length + 1);

	for (let j = 1; j <= s2.length; j++) {
		currentRow[0] = j;

		for (let i = 1; i <= s1.length; i++) {
			const insertCost = currentRow[i - 1] + 1;
			const deleteCost = previousRow[i] + 1;
			const replaceCost =
				s1[i - 1] === s2[j - 1] ? previousRow[i - 1] : previousRow[i - 1] + 1;

			currentRow[i] = Math.min(insertCost, deleteCost, replaceCost);
		}
		[previousRow, currentRow] = [currentRow, previousRow];
	}

	return previousRow[s1.length];
};

export { optimizedLevenshteinDistance };
