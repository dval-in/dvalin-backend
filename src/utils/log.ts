export const logToConsole = (path: string, message: string) => {
	console.log(`[${new Date().getTime()} | ${path}] ${message}`);
};
