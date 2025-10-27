import type { MeasurementUnit } from "@/enums/Medications";
import type { OcrLine } from "@/types/Ocr";

export type MedicationEntry = {
	name: string;
	dosage: number;
	measurement: MeasurementUnit;
	ocrLines: OcrLine[];
};
