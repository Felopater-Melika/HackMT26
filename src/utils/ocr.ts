import {
	type AzureReadResult,
	type OcrConfig,
	OcrFailedError,
	type OcrLine,
	type OcrResultStructured,
	OcrTimeoutError,
} from "@/types/Ocr";
import { calculateBackoff, wait } from "@/utils/utils";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";

function createVisionClient(config: OcrConfig): ComputerVisionClient {
	return new ComputerVisionClient(
		new CognitiveServicesCredentials(config.apiKey),
		config.endpoint,
	);
}

function extractOperationId(operationLocation: string): string {
	const operationId = operationLocation.split("/").pop();
	if (!operationId) {
		throw new OcrFailedError(
			"Failed to extract operation ID from operation location",
		);
	}
	return operationId;
}

async function pollForCompletion(
	client: ComputerVisionClient,
	operationId: string,
	maxSeconds: number,
	filename?: string,
): Promise<AzureReadResult> {
	const startTime = Date.now();
	const maxDuration = maxSeconds * 1000;
	let attempt = 0;

	while (Date.now() - startTime < maxDuration) {
		try {
			const result = await client.getReadResult(operationId);

			if (result.status === "succeeded") {
				console.log("OCR operation completed successfully", {
					operationId,
					filename,
				});
				return result as AzureReadResult;
			}

			if (result.status === "failed") {
				throw new OcrFailedError("OCR operation failed", result);
			}

			const delay = calculateBackoff(attempt);
			await wait(delay);
			attempt++;
		} catch (error) {
			if (error instanceof OcrFailedError) {
				throw error;
			}

			const delay = calculateBackoff(attempt);
			await wait(delay);
			attempt++;
		}
	}

	throw new OcrTimeoutError(
		`OCR operation timed out after ${maxSeconds} seconds`,
		operationId,
	);
}

function processOcrResult(
	result: AzureReadResult,
	filename?: string,
): OcrResultStructured {
	const lines: OcrLine[] = [];
	let totalPages = 0;

	if (result.analyzeResult?.readResults) {
		for (const page of result.analyzeResult.readResults) {
			totalPages = Math.max(totalPages, page.page);

			if (page.lines) {
				for (const line of page.lines) {
					lines.push({
						text: line.text,
						boundingBox: line.boundingBox,
						page: page.page,
						confidence: line.appearance?.style?.confidence,
					});
				}
			}
		}
	}

	return {
		filename,
		lines,
		totalLines: lines.length,
		pages: totalPages + 1,
	};
}

export async function analyzeImageOcr(
	buffer: Buffer,
	config: OcrConfig,
	filename?: string,
): Promise<OcrResultStructured> {
	const client = createVisionClient(config);
	const maxRetries = config.maxRetries || 3;
	const maxPollingSeconds = config.maxPollingSeconds || 60;

	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			console.log("Starting OCR analysis", { filename, attempt: attempt + 1 });

			const operation = await client.readInStream(buffer);

			const operationId = extractOperationId(operation.operationLocation);
			console.log("OCR operation started", { operationId, filename });

			const result = await pollForCompletion(
				client,
				operationId,
				maxPollingSeconds,
				filename,
			);
			const processedResult = processOcrResult(result, filename);

			console.log("OCR analysis completed successfully", {
				filename,
				lines: processedResult.totalLines,
				pages: processedResult.pages,
			});

			return processedResult;
		} catch (error) {
			lastError = error as Error;

			if (error instanceof OcrTimeoutError || error instanceof OcrFailedError) {
				throw error;
			}

			console.log("OCR analysis attempt failed, retrying", {
				filename,
				attempt: attempt + 1,
				error: error instanceof Error ? error.message : "Unknown error",
			});

			if (attempt < maxRetries - 1) {
				const delay = calculateBackoff(attempt);
				await wait(delay);
			}
		}
	}

	console.log("OCR analysis failed after all retries", {
		filename,
		error: lastError?.message,
	});
	throw new OcrFailedError(
		`OCR analysis failed after ${maxRetries} attempts`,
		lastError,
	);
}

export async function analyzeBatchOcr(
	files: Array<{ data: Buffer; filename?: string }>,
	config: OcrConfig,
): Promise<OcrResultStructured[]> {
	console.log("Starting batch OCR analysis", { fileCount: files.length });

	const results = await Promise.allSettled(
		files.map((file) => analyzeImageOcr(file.data, config, file.filename)),
	);

	const successfulResults: OcrResultStructured[] = [];
	const errors: Error[] = [];

	results.forEach((result, index) => {
		if (result.status === "fulfilled") {
			successfulResults.push(result.value);
		} else {
			const error = result.reason;
			console.log("Batch OCR item failed", {
				filename: files[index]?.filename,
				error: error.message,
			});
			errors.push(error);
		}
	});

	if (errors.length > 0) {
		console.log("Some batch OCR operations failed", {
			errorCount: errors.length,
			totalFiles: files.length,
		});
		if (successfulResults.length === 0) {
			throw errors[0];
		}
	}

	console.log("Batch OCR analysis completed", {
		successfulCount: successfulResults.length,
		totalFiles: files.length,
	});
	return successfulResults;
}
