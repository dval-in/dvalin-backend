interface BKTreeNode {
	word: string;
	children: { [key: number]: BKTreeNode };
}

interface SearchResult {
	word: string;
	distance: number;
}

class BKTree {
	public isInitialised: boolean = false;
	private root: BKTreeNode | null = null;
	private distanceFunction: (a: string, b: string) => number;

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

		return results.sort((a, b) => a.distance - b.distance);
	}
}

const toPascalCase = (input: string) => {
	return input
		.replace(/[^a-zA-Z\s-]/g, '')
		.split(/[-\s]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
};

export { BKTree };
