export type OcrConfig = {
	apiKey: string;
	endpoint: string;
	language?: string;
	maxPollingSeconds?: number;
	maxRetries?: number;
};

export type OcrLine = {
	text: string;
	boundingBox: number[];
	page: number;
	confidence?: number;
};

export type OcrResultStructured = {
	filename?: string;
	lines: OcrLine[];
	totalLines: number;
	pages: number;
};

export class OcrTimeoutError extends Error {
	constructor(
		message: string,
		public readonly operationId?: string,
	) {
		super(message);
		this.name = "OcrTimeoutError";
	}
}

export class OcrFailedError extends Error {
	constructor(
		message: string,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "OcrFailedError";
	}
}

export type AzureReadResult = {
	status: string;
	analyzeResult?: {
		readResults?: Array<{
			page: number;
			lines?: Array<{
				text: string;
				boundingBox: number[];
				appearance?: {
					style?: {
						confidence?: number;
					};
				};
			}>;
		}>;
	};
};
