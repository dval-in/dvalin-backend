export class MissingParametersError extends Error {
	constructor() {
		super('MISSING_PARAMETERS');
		this.name = 'MissingParametersError';
	}
}

export class NoAccountFoundError extends Error {
	constructor() {
		super('NO_ACCOUNT_FOUND');
		this.name = 'NoAccountFoundError';
	}
}

export class MissingUserError extends Error {
	constructor() {
		super('MISSING_USER');
		this.name = 'MissingUserError';
	}
}

export class MissingAuthKeyError extends Error {
	constructor() {
		super('MISSING_AUTHKEY');
		this.name = 'MissingAuthKeyError';
	}
}

export class InvalidAuthKeyError extends Error {
	constructor() {
		super('AUTHKEY_INVALID');
		this.name = 'InvalidAuthKeyError';
	}
}

export class QueueError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'QueueError';
	}
}

export class GitHubAPIError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GitHubAPIError';
	}
}
