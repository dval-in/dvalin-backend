/**
 * Generates a random delay between min and max milliseconds.
 *
 * @param min Minimum delay in milliseconds.
 * @param max Maximum delay in milliseconds.
 */
export const randomDelay = async (min: number, max: number): Promise<void> => {
	const duration = Math.floor(Math.random() * (max - min + 1) + min);
	await new Promise((resolve) => setTimeout(resolve, duration));
};
