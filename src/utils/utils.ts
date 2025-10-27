export async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
export function calculateBackoff(attempt: number): number {
	const baseDelay = 500;
	const maxDelay = 4000;
	const exponentialDelay = baseDelay * 2 ** attempt;
	return Math.min(exponentialDelay, maxDelay);
}
