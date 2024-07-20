interface BKTreeNode {
	word: string;
	children: { [key: number]: BKTreeNode };
}

interface SearchResult {
	word: string;
	distance: number;
}

class BKTree {
	private root: BKTreeNode | null = null;
	private readonly distanceFunction: (a: string, b: string) => number;

	constructor(distanceFunction: (a: string, b: string) => number) {
		this.distanceFunction = distanceFunction;
	}

	insert(word: string): void {
		if (this.root === null) {
			this.root = { word, children: {} };
		} else {
			let currentNode = this.root;
			let dist = this.distanceFunction(word, currentNode.word);

			while (currentNode.children[dist] !== undefined) {
				currentNode = currentNode.children[dist];
				dist = this.distanceFunction(word, currentNode.word);
			}

			currentNode.children[dist] = { word, children: {} };
		}
	}

	search(query: string, maxDistancePossible = 5): SearchResult[] {
		const results: SearchResult[] = [];
		const betterQuery = toPascalCase(query);
		const searchRecursive = (node: BKTreeNode): void => {
			const currentDistance = this.distanceFunction(betterQuery, node.word);
			const minDistance = currentDistance - maxDistancePossible;
			const maxDistance = currentDistance + maxDistancePossible;

			if (currentDistance <= maxDistance) {
				results.push({ word: node.word, distance: currentDistance });
			}

			Object.keys(node.children)
				.map(Number)
				.forEach((dist) => {
					if (dist >= minDistance && dist <= maxDistance) {
						searchRecursive(node.children[dist]);
					}
				});
		};

		if (this.root) {
			searchRecursive(this.root);
		}

		return results.sort((a, b) => {
			if (a.distance === b.distance) {
				return compareWordsByQueryOrder(betterQuery, a.word, b.word);
			}
			return a.distance - b.distance;
		});
	}
}

const toPascalCase = (input: string) => {
	return input
		.replace(/[^a-zA-Z\s-]/g, '')
		.split(/[-\s]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
};

const compareWordsByQueryOrder = (query: string, word1: string, word2: string): number => {
	const maxLength = Math.max(word1.length, word2.length);
	for (let i = 0; i < maxLength; i++) {
		const char1 = word1[i] || '';
		const char2 = word2[i] || '';

		if (char1 !== char2) {
			const index1 = query.indexOf(char1.toLowerCase());
			const index2 = query.indexOf(char2.toLowerCase());

			if (index1 !== -1 && index2 !== -1) {
				return index1 - index2;
			} else if (index1 !== -1) {
				return -1;
			} else if (index2 !== -1) {
				return 1;
			} else {
				return char1.localeCompare(char2);
			}
		}
	}
	return 0;
};

export { BKTree };
