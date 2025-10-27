export type OcrConfig = {
	apiKey: string;
	endpoint: string;
	language?: string;
	maxPollingSeconds?: number;
	maxRetries?: number;
};
