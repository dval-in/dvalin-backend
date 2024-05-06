const optimizedLevenshteinDistance = (s1: string, s2: string, maxDistanceAllowed = 3) => {
	// Early exit if the difference in lengths is greater than the maximum allowed edit distance
	if (Math.abs(s1.length - s2.length) > maxDistanceAllowed) {
		return Math.abs(s1.length - s2.length);
	}

	if (s1.length > s2.length) [s1, s2] = [s2, s1];

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

		// Swap the rows for the next iteration
		[previousRow, currentRow] = [currentRow, previousRow];
	}

	return previousRow[s1.length]; // The last element of previousRow now contains the answer
};

export { optimizedLevenshteinDistance };
