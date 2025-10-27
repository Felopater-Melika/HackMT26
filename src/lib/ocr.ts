import { env } from "@/env";
import type { OcrConfig } from "@/types/Ocr";

export function createOcrConfig(overrides?: Partial<OcrConfig>): OcrConfig {
	return {
		apiKey: env.AZURE_OCR_KEY,
		endpoint: env.AZURE_OCR_ENDPOINT,
		language: "en",
		maxPollingSeconds: 30,
		maxRetries: 3,
		...overrides,
	};
}
