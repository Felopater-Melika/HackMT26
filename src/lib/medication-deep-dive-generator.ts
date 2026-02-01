/**
 * Medication Deep-Dive Generator
 *
 * Generates comprehensive, personalized medication information using Azure OpenAI
 * with FDA data and patient profile context.
 */

import { AzureChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { env } from "@/env";
import {
	medicationDeepDiveOutputSchema,
	type MedicationDeepDiveOutput,
} from "@/types/medication-deep-dive";
import { createOpenFDATool } from "@/utils/api/openfda-tool";
import { createPatientRecordsTool } from "@/utils/api/patient-records-tool";
import type { db } from "@/server/db";
import crypto from "crypto";

/**
 * Configuration for deep-dive generation
 */
export interface DeepDiveGeneratorConfig {
	userId: string;
	medicationName: string;
	openFdaLabelText?: string;
	temperature?: number;
	maxTokens?: number;
}

/**
 * Result of deep-dive generation
 */
export interface DeepDiveGenerationResult {
	success: boolean;
	data?: MedicationDeepDiveOutput;
	inputsHash: string;
	openfdaDataHash?: string;
	rawResponse: string;
	latencyMs: number;
	error?: string;
}

/**
 * Medication Deep-Dive Generator Class
 * Follows the same pattern as MedicationAnalyzer
 */
export class MedicationDeepDiveGenerator {
	private llm: AzureChatOpenAI;
	private userId: string;
	private database: typeof db;

	constructor(
		database: typeof db,
		userId: string,
		config?: { temperature?: number; maxTokens?: number },
	) {
		this.userId = userId;
		this.database = database;

		// Extract instance name from endpoint (same pattern as MedicationAnalyzer)
		const instanceName = env.AZURE_AI_ENDPOINT.replace("https://", "")
			.replace("http://", "")
			.split(".")[0];

		console.log("🔧 [DEEP-DIVE GENERATOR]");
		console.log("  Instance Name:", instanceName);
		console.log("  Deployment:", env.AZURE_AI_DEPLOYMENT);
		console.log("  Temperature:", config?.temperature ?? 0.2);
		console.log("  Max Tokens:", config?.maxTokens ?? 3500);

		// Initialize Azure OpenAI with lower temperature for more deterministic medical content
		this.llm = new AzureChatOpenAI({
			azureOpenAIApiKey: env.AZURE_AI_API_KEY,
			azureOpenAIApiVersion: env.AZURE_AI_API_VERSION,
			azureOpenAIApiDeploymentName: env.AZURE_AI_DEPLOYMENT,
			azureOpenAIApiInstanceName: instanceName,
			temperature: config?.temperature ?? 0.2, // Lower than MedicationAnalyzer for consistency
			maxTokens: config?.maxTokens ?? 3500, // Higher for comprehensive response
		});
	}

	/**
	 * Generate SHA-256 hash of inputs for caching
	 * Hash includes: medication name, user ID, patient data, OpenFDA data
	 */
	private generateInputsHash(
		medicationName: string,
		patientProfileData: string,
		openFdaData: string,
	): string {
		const input = `${medicationName}|${this.userId}|${patientProfileData}|${openFdaData}`;
		return crypto.createHash("sha256").update(input).digest("hex");
	}

	/**
	 * Generate hash of OpenFDA data for cache invalidation
	 */
	private generateOpenFDAHash(openFdaData: string): string {
		return crypto.createHash("sha256").update(openFdaData).digest("hex");
	}

	/**
	 * Generate a comprehensive medication deep-dive
	 *
	 * Uses a 2-call approach:
	 * 1. First call: AI requests tools (OpenFDA + Patient Records)
	 * 2. Second call: AI generates analysis based on tool results
	 */
	async generate(
		config: DeepDiveGeneratorConfig,
	): Promise<DeepDiveGenerationResult> {
		const startTime = Date.now();

		try {
			console.log(
				`🚀 [DEEP-DIVE] Starting generation for "${config.medicationName}"`,
			);

			// Create tools
			const openFDATool = createOpenFDATool();
			const patientRecordsTool = createPatientRecordsTool(
				this.database,
				this.userId,
			);

			// Bind tools to model
			const modelWithTools = this.llm.bindTools([
				openFDATool,
				patientRecordsTool,
			]);

			// System prompt with comprehensive JSON schema
			const systemMessage = new SystemMessage(`You are a medical information specialist who provides comprehensive medication information to patients.

CRITICAL: You MUST respond with ONLY a valid JSON object matching this EXACT structure:

{
  "summary": "Brief 2-3 sentence overview of the medication",
  "whatItTreats": ["Condition 1", "Condition 2", "Condition 3"],
  "howItWorks": "Detailed explanation of the medication's mechanism of action in patient-friendly language",
  "howToTake": {
    "timing": "When to take the medication (e.g., 'Take once daily in the morning')",
    "withFood": "Food instructions (e.g., 'Take with food to reduce stomach upset' or 'Can be taken with or without food')",
    "missedDose": "What to do if you miss a dose (e.g., 'Take as soon as you remember unless it is close to your next dose')"
  },
  "expectedTimeline": "When to expect results and recommended duration (e.g., 'You may feel better within 2-4 weeks. Continue for at least 6 months or as directed by your doctor')",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "sideEffects": {
    "common": ["Common side effect 1", "Common side effect 2", "Common side effect 3"],
    "serious": ["Serious side effect 1", "Serious side effect 2"]
  },
  "personalizedWarnings": ["Warning specific to this patient's profile", "Another personalized warning"],
  "interactions": ["Drug or food interaction 1", "Drug or food interaction 2"],
  "lifestyle": ["Lifestyle consideration 1", "Lifestyle consideration 2"],
  "monitoring": ["What to monitor 1", "What to monitor 2"],
  "questionsToAskDoctor": ["Question 1", "Question 2", "Question 3"],
  "confidence": {
    "overall": "low|medium|high",
    "reason": "Explanation for the confidence level (e.g., 'High confidence: Complete FDA data and patient profile available')"
  },
  "sourcesUsed": {
    "scanLabel": true,
    "openFda": true,
    "patientProfile": true
  },
  "disclaimer": "This information is for educational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider before starting, stopping, or changing any medication."
}

INSTRUCTIONS:
1. First, call patient_records_lookup tool to understand the patient's medical context
2. Then, call openfda_drug_lookup tool to get official FDA medication information
3. Generate personalized analysis based on BOTH sources
4. Personalize ALL warnings and interactions based on:
   - Patient's existing medical conditions
   - Patient's current medications (check for drug-drug interactions)
   - Patient's age and gender
5. Use simple, patient-friendly language throughout
6. Keep arrays to 3-5 items maximum for readability
7. Set confidence level based on data availability:
   - "high": Both OpenFDA and patient profile available with complete data
   - "medium": Either OpenFDA or patient profile missing, or partial data
   - "low": Both sources missing or very limited data
8. Always include the disclaimer
9. Be specific and actionable in all recommendations
10. DO NOT include markdown, code blocks, or any text outside the JSON object

Remember: This is medical information for real patients. Be accurate, thorough, and clear.`);

			// User message with context
			const userMessage = new HumanMessage(`Generate a comprehensive deep-dive for the medication: "${config.medicationName}"

${config.openFdaLabelText ? `\n Scanned Label Text:\n${config.openFdaLabelText}\n\n` : ""}

Please follow these steps:
1. Call patient_records_lookup to get the patient's medical context
2. Call openfda_drug_lookup for "${config.medicationName}" to get FDA-approved information
3. Generate the complete JSON response with all required fields

Focus on personalization based on:
- Patient's existing medical conditions
- Current medications they are taking (check for interactions)
- Age and gender considerations
- Any relevant warnings from their medical history

Ensure all arrays contain 3-5 items and all text is patient-friendly.`);

			// First call to get tool calls
			console.log("📞 [DEEP-DIVE] Calling LLM (tool selection)...");
			const response = await modelWithTools.invoke([
				systemMessage,
				userMessage,
			]);

			let analysisText = "";
			let patientData = "";
			let openFdaData = "";

			// Execute tool calls if requested
			if (response.tool_calls && response.tool_calls.length > 0) {
				console.log(
					`🔧 [DEEP-DIVE] AI requested ${response.tool_calls.length} tool call(s)`,
				);
				const toolResults = [];

				for (const toolCall of response.tool_calls) {
					console.log(`  📌 Calling tool: ${toolCall.name}`);

					try {
						if (toolCall.name === "openfda_drug_lookup") {
							const result = await openFDATool.func(
								toolCall.args as { medicationName: string },
							);
							openFdaData = result;
							toolResults.push({ tool: "openfda_drug_lookup", result });
							console.log("  ✅ OpenFDA lookup completed");
						} else if (toolCall.name === "patient_records_lookup") {
							const result = await patientRecordsTool.func(
								toolCall.args as { medicationName?: string },
							);
							patientData = result;
							toolResults.push({ tool: "patient_records_lookup", result });
							console.log("  ✅ Patient records lookup completed");
						}
					} catch (error) {
						console.error(`  ❌ Error executing tool ${toolCall.name}:`, error);
						toolResults.push({
							tool: toolCall.name,
							result: JSON.stringify({
								error: "Tool execution failed",
								message:
									error instanceof Error ? error.message : "Unknown error",
							}),
						});
					}
				}

				// Second call with tool results
				console.log("📞 [DEEP-DIVE] Calling LLM (final analysis)...");
				const toolResultsMessage = new HumanMessage(
					`Tool Results:\n\n${toolResults.map((tr) => `${tr.tool}:\n${tr.result}`).join("\n\n")}\n\nNow generate the complete JSON response based on these results.`,
				);

				const finalResponse = await this.llm.invoke([
					systemMessage,
					userMessage,
					toolResultsMessage,
				]);

				analysisText = finalResponse.content as string;
			} else {
				// No tool calls, use direct response
				analysisText = response.content as string;
			}

			console.log("🔍 [DEEP-DIVE] Parsing and validating JSON response...");

			// Extract JSON from response
			const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON object found in LLM response");
			}

			// Parse JSON
			const rawJson = JSON.parse(jsonMatch[0]);

			// Validate against schema
			const validatedData = medicationDeepDiveOutputSchema.parse(rawJson);

			// Update sources used based on what was actually retrieved
			validatedData.sourcesUsed = {
				scanLabel: Boolean(config.openFdaLabelText),
				openFda: openFdaData.includes('"found": true'),
				patientProfile: patientData.includes('"profile"'),
			};

			// Generate hashes for caching
			const inputsHash = this.generateInputsHash(
				config.medicationName,
				patientData,
				openFdaData,
			);
			const openfdaDataHash = openFdaData
				? this.generateOpenFDAHash(openFdaData)
				: undefined;

			const latencyMs = Date.now() - startTime;

			console.log(
				`✅ [DEEP-DIVE] Generation completed in ${latencyMs}ms with ${validatedData.confidence.overall} confidence`,
			);

			return {
				success: true,
				data: validatedData,
				inputsHash,
				openfdaDataHash,
				rawResponse: analysisText,
				latencyMs,
			};
		} catch (error) {
			const latencyMs = Date.now() - startTime;
			console.error("❌ [DEEP-DIVE] Generation failed:", error);

			// Return fallback with low confidence
			const fallbackHash = crypto
				.createHash("sha256")
				.update(`${config.medicationName}|${this.userId}|error`)
				.digest("hex");

			return {
				success: false,
				inputsHash: fallbackHash,
				rawResponse: error instanceof Error ? error.message : "Unknown error",
				latencyMs,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

/**
 * Factory function to create a deep-dive generator
 * Follows the same pattern as createMedicationAnalyzer
 */
export function createDeepDiveGenerator(
	database: typeof db,
	userId: string,
	config?: { temperature?: number; maxTokens?: number },
): MedicationDeepDiveGenerator {
	return new MedicationDeepDiveGenerator(database, userId, config);
}
