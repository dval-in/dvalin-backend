export const logToConsole = (path: string, message: string) => {
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

	console.log(`[${formattedDate} | ${path}] ${message}`);
};
