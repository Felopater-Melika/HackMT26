/**
 * Example usage of the Medication Analyzer
 * 
 * Demonstrates how to use the medication analyzer with Azure OpenAI
 */

import { createMedicationAnalyzer } from "./medication-analyzer";

/**
 * Example 1: Analyze a single medication
 */
export async function exampleSingleMedication(userId: string) {
	const analyzer = createMedicationAnalyzer({
		userId,
		temperature: 0.3,
	});

	const result = await analyzer.analyzeMedication("aspirin");

	console.log("Medication:", result.medicationName);
	console.log("Safety Score:", result.safetyScore);
	console.log("Requires Attention:", result.requiresAttention);
	console.log("\nWarnings:");
	result.warnings.forEach((w) => console.log(`- ${w}`));
	console.log("\nInteractions:");
	result.interactions.forEach((i) => console.log(`- ${i}`));
	console.log("\nRecommendations:");
	result.recommendations.forEach((r) => console.log(`- ${r}`));

	return result;
}

/**
 * Example 2: Analyze multiple medications for interactions
 */
export async function exampleMultipleMedications(userId: string) {
	const analyzer = createMedicationAnalyzer({
		userId,
		temperature: 0.3,
	});

	const result = await analyzer.analyzeMultipleMedications([
		"aspirin",
		"ibuprofen",
		"warfarin",
	]);

	console.log("Medications:", result.medications.join(", "));
	console.log("\nOverall Analysis:");
	console.log(result.overallAnalysis);
	console.log("\nInteractions:");
	result.interactions.forEach((i) => console.log(`- ${i}`));

	return result;
}

/**
 * Example 3: Use with tRPC
 */
export async function exampleWithTRPC() {
	// In your React component:
	// const { mutate: analyzeMedication } = api.medicationAnalysis.analyzeSingle.useMutation();
	// 
	// analyzeMedication(
	//   { medicationName: "aspirin" },
	//   {
	//     onSuccess: (data) => {
	//       console.log("Analysis:", data);
	//       // Display results to user
	//     },
	//   }
	// );
}

