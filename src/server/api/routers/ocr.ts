import { MeasurementUnit } from "@/enums/Medications";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { OcrConfig } from "@/types/Ocr";
import { searchByDrugName } from "@/utils/api/rxnav";
import { analyzeBatchOcr } from "@/utils/ocr";
import { env } from "@/env.js";
import { z } from "zod";

// Normalize OCR text lines for cleaner parsing
function normalizeText(input: string): string {
	return input
		.replace(/\s+/g, " ") // collapse multiple spaces
		.replace(/[^\w\s.%/-]/g, "") // remove symbols except dose chars
		.replace(/\bmg\b/gi, "mg")
		.replace(/\bml\b/gi, "ml")
		.trim()
		.toLowerCase();
}

export const ocrRouter = createTRPCRouter({
	analyzeImages: publicProcedure
		.input(
			z.object({
				files: z.array(
					z.object({
						data: z.string(), // Base64 encoded string
						filename: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ input }) => {
			const { files } = input;

			// Convert base64 strings to Buffers
			const bufferFiles = files.map((file) => ({
				data: Buffer.from(file.data, "base64"),
				filename: file.filename,
			}));

			// Build config from server environment variables
			const config: OcrConfig = {
				apiKey: env.AZURE_OCR_KEY,
				endpoint: env.AZURE_OCR_ENDPOINT,
			};

			// Step 1: Run OCR
			const ocrResults = await analyzeBatchOcr(bufferFiles, config);

			// Step 2: Collect full OCR lines per image (unmodified) and normalized text lines
			const images = ocrResults.map((r) => ({
				filename: r.filename,
				lines: r.lines.map((l) => l.text),
			}));

			// Normalized for parsing
			const texts = ocrResults
				.flatMap((r) => r.lines.map((l) => normalizeText(l.text)))
				.filter((t) => t.length > 2);

			// Step 3: Extract unique candidates
			const candidates = Array.from(
				new Set(
					texts
						.map((t) => t.replace(/\d+(\.\d+)?\s*[a-zA-Z]+/g, "").trim()) // remove dosage strings
						.filter((t) => /^[a-z0-9\s-]{3,}$/.test(t)),
				),
			);

			// Step 4: Detect dosages + units
			// Sort units by length (longest first) to avoid partial matches of shorter units
			const sortedUnits = Object.values(MeasurementUnit).sort((a, b) => b.length - a.length);
			const unitPattern = sortedUnits.join("|");
			
			// Match patterns like: "500mg", "500 mg", "0.5mg", "1/2 tablet", "1-2 capsules"
			const dosageRegex = new RegExp(
				`(\\d+(?:\\.\\d+)?(?:/\\d+)?)\\s*(${unitPattern})(?:s)?(?:\\s|$|,|;|:|\\.)`,
				"gi",
			);

			const dosageData = texts.flatMap((line) => {
				const matches = [...line.matchAll(dosageRegex)];
				return matches.map((m) => {
					const valueStr = m[1];
					const unitStr = m[2];
					if (!valueStr || !unitStr) return null;
					
					// Parse fractional dosages like "1/2" to 0.5
					let value: number;
					if (valueStr.includes("/")) {
						const [numerator, denominator] = valueStr.split("/");
						if (!numerator || !denominator) return null;
						value = Number.parseFloat(numerator) / Number.parseFloat(denominator);
					} else {
						value = Number.parseFloat(valueStr);
					}
					
					return {
						value,
						unit: unitStr.toLowerCase() as MeasurementUnit,
						context: line,
					};
				}).filter((item): item is Exclude<typeof item, null> => item !== null);
			});

			// Step 5: Query RxNav for each candidate
			const lookups = await Promise.allSettled(
				candidates.map(async (drug) => ({
					drug,
					results: await searchByDrugName(drug),
				})),
			);

			// Step 6: Collect valid results with OCR lines
			const medications: Array<{
				name: string;
				dosage: number | null;
				measurement: string | null;
				ocrLines: string[];
			}> = [];

			for (const res of lookups) {
				if (res.status === "fulfilled" && res.value.results.length > 0) {
					const drugName = res.value.drug;
					
					// First, try to find dosages mentioned on the same line as the drug name
					const matchedDosages = dosageData.filter((d) =>
						d.context.includes(drugName.toLowerCase()),
					);
					
					// If no dosages found on same line, use any dosages from the document
					// (common in OCR where drug name and dosage might be on different lines)
					const dosagesToUse = matchedDosages.length > 0 ? matchedDosages : dosageData;

					// Get ALL OCR lines from images that mention this drug name
					const relatedOcrLines = ocrResults.flatMap((result) => {
						// Check if this image contains the drug name
						const imageContainsDrug = result.lines.some((line) =>
							normalizeText(line.text).includes(drugName.toLowerCase()),
						);
						
						// If drug found in this image, return ALL lines from this image
						if (imageContainsDrug) {
							return result.lines.map((line) => line.text);
						}
						return [];
					});

					// Use first matched dosage or null
					const primaryDosage = dosagesToUse[0];

					medications.push({
						name: drugName,
						dosage: primaryDosage?.value ?? null,
						measurement: primaryDosage?.unit ?? null,
						ocrLines: relatedOcrLines,
					});
				}
			}

			return {
				medications,
			};
		}),
});
