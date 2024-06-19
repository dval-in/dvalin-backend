class PriorityQueue<T> {
	private heap: T[];
	private comparator: (a: T, b: T) => number;

	constructor(comparator: (a: T, b: T) => number) {
		this.heap = [];
		this.comparator = comparator;
	}

	private leftChild(index: number): number {
		return 2 * index + 1;
	}

	private rightChild(index: number): number {
		return 2 * index + 2;
	}

	private parent(index: number): number {
		return Math.floor((index - 1) / 2);
	}

	private swap(index1: number, index2: number): void {
		[this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
	}

	private siftUp(index: number): void {
		let parentIndex = this.parent(index);
		while (index > 0 && this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
			this.swap(index, parentIndex);
			index = parentIndex;
			parentIndex = this.parent(index);
		}
	}

	private siftDown(index: number): void {
		let left = this.leftChild(index);
		let right = this.rightChild(index);
		let smallest = index;

		if (left < this.heap.length && this.comparator(this.heap[left], this.heap[smallest]) < 0) {
			smallest = left;
		}
		if (
			right < this.heap.length &&
			this.comparator(this.heap[right], this.heap[smallest]) < 0
		) {
			smallest = right;
		}
		if (smallest !== index) {
			this.swap(index, smallest);
			this.siftDown(smallest);
		}
	}

	public enqueue(item: T): void {
		this.heap.push(item);
		this.siftUp(this.heap.length - 1);
	}

	public dequeue(): T | undefined {
		if (this.heap.length === 0) {
			return undefined;
		}
		const result = this.heap[0];
		const last = this.heap.pop();
		if (this.heap.length > 0 && last !== undefined) {
			this.heap[0] = last;
			this.siftDown(0);
		}
		return result;
	}

	public peek(): T | undefined {
		return this.heap.length > 0 ? this.heap[0] : undefined;
	}

	public size(): number {
		return this.heap.length;
	}
}
