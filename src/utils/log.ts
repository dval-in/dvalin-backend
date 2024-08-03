import chalk from 'chalk';

export const logToConsole = (
	path: string,
	message: string,
	level: 'info' | 'warn' | 'error' = 'info'
) => {
	const now = new Date();
	const formattedDate = now.toLocaleString('fr-Fr', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});

	const timestamp = chalk.gray(`[${formattedDate}]`);
	const pathInfo = chalk.cyan(`[${path}]`);

	let coloredMessage;
	switch (level) {
		case 'info':
			coloredMessage = chalk.green(message);
			break;
		case 'warn':
			coloredMessage = chalk.yellow(message);
			break;
		case 'error':
			coloredMessage = chalk.red(message);
			break;
	}

	console.log(`${timestamp} ${pathInfo} ${coloredMessage}`); // NOSONAR
};
