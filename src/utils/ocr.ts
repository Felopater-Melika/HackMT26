import type { OcrConfig } from "@/types/ocr";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";

function createVisionClient(config: OcrConfig): ComputerVisionClient {
	return new ComputerVisionClient(
		new CognitiveServicesCredentials(config.apiKey),
		config.endpoint,
	);
}
