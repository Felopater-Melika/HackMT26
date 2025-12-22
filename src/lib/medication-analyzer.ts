/**
 * Medication Analyzer with Azure OpenAI and LangGraph
 * 
 * Uses LangGraph and tools to analyze medications and provide tailored advice
 * based on patient records and FDA data.
 */

import { AzureChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createOpenFDATool } from "@/utils/api/openfda-tool";
import { createPatientRecordsTool } from "@/utils/api/patient-records-tool";
import { db } from "@/server/db";
import { env } from "@/env";

/**
 * Medication analysis result
 */
export interface MedicationAnalysisResult {
	medicationName: string;
	analysis: string;
	warnings: string[];
	interactions: string[];
	recommendations: string[];
	safetyScore: number; // 0-100
	requiresAttention: boolean;
	rawResponse: string;
}

/**
 * Configuration for the medication analyzer
 */
export interface MedicationAnalyzerConfig {
	userId: string;
	temperature?: number;
	maxTokens?: number;
	model?: string;
}

/**
 * Creates a medication analyzer agent with Azure OpenAI
 */
export class MedicationAnalyzer {
	private llm: AzureChatOpenAI;
	private userId: string;

	constructor(config: MedicationAnalyzerConfig) {
		this.userId = config.userId;

		// Extract instance name from endpoint
		// Example: https://my-resource.openai.azure.com -> my-resource
		const instanceName = env.AZURE_AI_ENDPOINT
			.replace("https://", "")
			.replace("http://", "")
			.split(".")[0];

		console.log("🔧 [AZURE CONFIG]");
		console.log("  Instance Name:", instanceName);
		console.log("  Deployment:", env.AZURE_AI_DEPLOYMENT);
		console.log("  API Version:", env.AZURE_AI_API_VERSION);
		console.log("  Endpoint:", env.AZURE_AI_ENDPOINT);

		// Initialize Azure OpenAI
		this.llm = new AzureChatOpenAI({
			azureOpenAIApiKey: env.AZURE_AI_API_KEY,
			azureOpenAIApiVersion: env.AZURE_AI_API_VERSION,
			azureOpenAIApiDeploymentName: env.AZURE_AI_DEPLOYMENT,
			azureOpenAIApiInstanceName: instanceName,
			temperature: config.temperature ?? 0.3,
			maxTokens: config.maxTokens ?? 2000,
		});
	}

	/**
	 * Analyzes a medication and provides tailored advice
	 * 
	 * @param medicationName - Name of the medication to analyze
	 * @returns Detailed analysis with personalized recommendations
	 */
	async analyzeMedication(
		medicationName: string,
	): Promise<MedicationAnalysisResult> {
		// Create tools
		const openFDATool = createOpenFDATool();
		const patientRecordsTool = createPatientRecordsTool(db, this.userId);

		// Bind tools to the model
		const modelWithTools = this.llm.bindTools([openFDATool, patientRecordsTool]);

		const systemMessage = new SystemMessage(`You are a medical safety assistant. Analyze medications and provide safety information.

RESPONSE FORMAT - You must respond with this exact JSON structure:
{
  "safetyScore": <number 0-100>,
  "requiresAttention": <boolean>,
  "warnings": ["warning 1", "warning 2", ...],
  "interactions": ["interaction 1", "interaction 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "summary": "Brief 2-3 sentence overview"
}

ANALYSIS GUIDELINES:
1. Use patient_records_lookup tool to get patient context (conditions, current medications, demographics)
2. Use openfda_drug_lookup tool to get FDA medication information
3. Safety Score: 0-100 (100=safest, 0=critical concern)
   - 90-100: Very safe, minimal concerns
   - 70-89: Generally safe with precautions
   - 50-69: Moderate concerns, consult doctor
   - 0-49: Significant concerns, immediate consultation
4. Set requiresAttention to true if score < 70 or severe warnings exist
5. Warnings: List specific patient-relevant warnings (max 5)
6. Interactions: List drug-drug or drug-condition interactions (max 5)
7. Recommendations: Actionable steps for the patient (max 5)
8. Summary: Brief overview mentioning key concerns

Be concise, specific, and patient-focused.`);

		const userMessage = new HumanMessage(`Analyze "${medicationName}" for this patient.

1. Call patient_records_lookup (with medicationName: "${medicationName}")
2. Call openfda_drug_lookup (with medicationName: "${medicationName}")
3. Analyze the data and respond ONLY with the JSON structure specified in the system message.

Focus on:
- Patient-specific drug interactions (check current medications)
- Contraindications (check patient conditions)
- Age/gender-specific concerns
- Critical warnings requiring attention`);

		// First call to get tool calls
		const response = await modelWithTools.invoke([systemMessage, userMessage]);

		let analysisText = "";

		// Check if the model wants to use tools
		if (response.tool_calls && response.tool_calls.length > 0) {
			console.log("\n🔧 [TOOL USAGE] AI requested", response.tool_calls.length, "tool call(s)");
			const toolResults = [];

			// Execute tool calls
			for (const toolCall of response.tool_calls) {
				console.log("\n📞 Calling tool:", toolCall.name);
				console.log("   Arguments:", JSON.stringify(toolCall.args, null, 2));
				
				try {
					if (toolCall.name === "openfda_drug_lookup") {
						const startTime = Date.now();
						const result = await openFDATool.func(toolCall.args as { medicationName: string });
						const duration = Date.now() - startTime;
						
						console.log(`✅ OpenFDA lookup completed in ${duration}ms`);
						console.log("   Result preview:", result.substring(0, 200) + "...");
						
						toolResults.push({
							tool: "openfda_drug_lookup",
							result: result,
						});
					} else if (toolCall.name === "patient_records_lookup") {
						const startTime = Date.now();
						const result = await patientRecordsTool.func(toolCall.args as { medicationName?: string });
						const duration = Date.now() - startTime;
						
						console.log(`✅ Patient records lookup completed in ${duration}ms`);
						console.log("   Result preview:", result.substring(0, 200) + "...");
						
						toolResults.push({
							tool: "patient_records_lookup",
							result: result,
						});
					}
				} catch (error) {
					console.error(`❌ Error executing tool ${toolCall.name}:`, error);
					toolResults.push({
						tool: toolCall.name,
						result: JSON.stringify({ error: "Tool execution failed" }),
					});
				}
			}
			
			console.log("\n📊 [TOOL RESULTS] All", toolResults.length, "tool(s) executed successfully");
			console.log("   Sending results back to AI for final analysis...\n");

			// Create a message with tool results
			const toolResultsMessage = new HumanMessage(
				`Tool Results:\n\n${toolResults.map((tr) => `${tr.tool}:\n${tr.result}`).join("\n\n")}

Now provide your comprehensive analysis based on this information.`,
			);

			// Get final analysis
			const finalResponse = await this.llm.invoke([
				systemMessage,
				userMessage,
				toolResultsMessage,
			]);

			analysisText = finalResponse.content as string;
		} else {
			analysisText = response.content as string;
		}

		// Extract structured information from the response
		const parsed = this.parseAnalysisResponse(analysisText, medicationName);

		return parsed;
	}

	/**
	 * Analyzes multiple medications for interactions
	 */
	async analyzeMultipleMedications(
		medicationNames: string[],
	): Promise<{
		medications: string[];
		overallAnalysis: string;
		overallSafetyScore?: number;
		requiresAttention?: boolean;
		interactions: string[];
		recommendations: string[];
		rawResponse: string;
	}> {
		const openFDATool = createOpenFDATool();
		const patientRecordsTool = createPatientRecordsTool(db, this.userId);

		const modelWithTools = this.llm.bindTools([openFDATool, patientRecordsTool]);

		const systemMessage = new SystemMessage(`You are a medical safety assistant analyzing multiple medications.

RESPONSE FORMAT - You must respond with this exact JSON structure:
{
  "overallSafetyScore": <number 0-100>,
  "requiresAttention": <boolean>,
  "interactions": ["interaction 1", "interaction 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "summary": "Brief 2-3 sentence overview of combined risks"
}

Focus on drug-drug interactions and combined contraindications.`);

		const medicationList = medicationNames.join(", ");

		const userMessage = new HumanMessage(`Analyze drug interactions for: ${medicationList}

1. Call patient_records_lookup
2. Call openfda_drug_lookup for each medication
3. Identify interactions between these specific medications
4. Respond ONLY with the JSON structure specified in the system message.

Focus on: Drug-drug interactions, combined contraindications, cumulative effects.`);

		// Get response with tool calls
		const response = await modelWithTools.invoke([systemMessage, userMessage]);

		let analysisText = "";

		if (response.tool_calls && response.tool_calls.length > 0) {
			console.log("\n🔧 [TOOL USAGE - MULTI] AI requested", response.tool_calls.length, "tool call(s)");
			const toolResults = [];

			for (const toolCall of response.tool_calls) {
				console.log("\n📞 Calling tool:", toolCall.name);
				console.log("   Arguments:", JSON.stringify(toolCall.args, null, 2));
				
				try {
					if (toolCall.name === "openfda_drug_lookup") {
						const startTime = Date.now();
						const result = await openFDATool.func(toolCall.args as { medicationName: string });
						const duration = Date.now() - startTime;
						
						console.log(`✅ OpenFDA lookup completed in ${duration}ms`);
						console.log("   Result preview:", result.substring(0, 200) + "...");
						
						toolResults.push({
							tool: "openfda_drug_lookup",
							result: result,
						});
					} else if (toolCall.name === "patient_records_lookup") {
						const startTime = Date.now();
						const result = await patientRecordsTool.func(toolCall.args as { medicationName?: string });
						const duration = Date.now() - startTime;
						
						console.log(`✅ Patient records lookup completed in ${duration}ms`);
						console.log("   Result preview:", result.substring(0, 200) + "...");
						
						toolResults.push({
							tool: "patient_records_lookup",
							result: result,
						});
					}
				} catch (error) {
					console.error(`❌ Error executing tool ${toolCall.name}:`, error);
					toolResults.push({
						tool: toolCall.name,
						result: JSON.stringify({ error: "Tool execution failed" }),
					});
				}
			}
			
			console.log("\n📊 [TOOL RESULTS] All", toolResults.length, "tool(s) executed successfully");
			console.log("   Sending results back to AI for final analysis...\n");

			const toolResultsMessage = new HumanMessage(
				`Tool Results:\n\n${toolResults.map((tr) => `${tr.tool}:\n${tr.result}`).join("\n\n")}

Now provide your comprehensive analysis of interactions between these medications based on this information.`,
			);

			const finalResponse = await this.llm.invoke([
				systemMessage,
				userMessage,
				toolResultsMessage,
			]);

			analysisText = finalResponse.content as string;
		} else {
			analysisText = response.content as string;
		}

		// Try to parse as JSON first
		try {
			const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				
				return {
					medications: medicationNames,
					overallAnalysis: parsed.summary || analysisText,
					overallSafetyScore: typeof parsed.overallSafetyScore === 'number' ? parsed.overallSafetyScore : 75,
					requiresAttention: typeof parsed.requiresAttention === 'boolean' ? parsed.requiresAttention : false,
					interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
					recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
					rawResponse: analysisText,
				};
			}
		} catch (error) {
			console.warn("⚠️  Failed to parse multi-medication JSON response, falling back to text extraction");
		}

		// Fallback: Extract from text
		const interactions = this.extractListItems(analysisText, "interaction");
		const recommendations = this.extractListItems(analysisText, "recommendation");

		return {
			medications: medicationNames,
			overallAnalysis: analysisText,
			interactions,
			recommendations,
			rawResponse: analysisText,
		};
	}

	/**
	 * Parses the AI response into structured data
	 */
	private parseAnalysisResponse(
		text: string,
		medicationName: string,
	): MedicationAnalysisResult {
		// Try to parse as JSON first
		try {
			// Look for JSON object in the response
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				
				return {
					medicationName,
					analysis: parsed.summary || text,
					warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
					interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
					recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
					safetyScore: typeof parsed.safetyScore === 'number' ? parsed.safetyScore : 75,
					requiresAttention: typeof parsed.requiresAttention === 'boolean' ? parsed.requiresAttention : false,
					rawResponse: text,
				};
			}
		} catch (error) {
			console.warn("⚠️  Failed to parse JSON response, falling back to text extraction");
		}

		// Fallback: Extract from text if JSON parsing fails
		const scoreMatch = text.match(/(?:safety\s*score|score)[:\s]+(\d+)(?:\/100)?/i);
		const safetyScore = scoreMatch && scoreMatch[1] ? parseInt(scoreMatch[1], 10) : 75;

		const warnings = this.extractListItems(text, "warning");
		const interactions = this.extractListItems(text, "interaction");
		const recommendations = this.extractListItems(text, "recommendation");

		// Extract summary (first paragraph or first 2-3 sentences)
		const summaryMatch = text.match(/^(.{100,300}?[.!?])/);
		const summary = summaryMatch ? summaryMatch[1].trim() : text.substring(0, 200);

		const requiresAttention =
			safetyScore < 70 ||
			warnings.some((w) => {
				const lower = w.toLowerCase();
				return lower.includes("severe") || lower.includes("critical") || lower.includes("serious");
			});

		return {
			medicationName,
			analysis: summary,
			warnings,
			interactions,
			recommendations,
			safetyScore,
			requiresAttention,
			rawResponse: text,
		};
	}

	/**
	 * Extracts list items from text based on keywords
	 */
	private extractListItems(text: string, keyword: string): string[] {
		const items: string[] = [];
		const lines = text.split("\n");

		let inSection = false;
		for (const line of lines) {
			const trimmed = line.trim();

			// Check if we're entering a relevant section
			const lowerTrimmed = trimmed.toLowerCase();
			if (
				lowerTrimmed.includes(keyword) &&
				(trimmed.includes(":") || trimmed.includes("##"))
			) {
				inSection = true;
				continue;
			}

			// Check if we're leaving the section (new header)
			if (inSection && trimmed.match(/^#+\s+|^[A-Z][^:]+:$/)) {
				inSection = false;
			}

			// Extract items (bullet points or numbered lists)
			if (inSection && (trimmed.match(/^[-*•]\s+/) || trimmed.match(/^\d+\.\s+/))) {
				const item = trimmed.replace(/^[-*•]\s+|\d+\.\s+/, "").trim();
				if (item.length > 0) {
					items.push(item);
				}
			}
		}

		return items;
	}
}

/**
 * Creates a medication analyzer instance
 */
export function createMedicationAnalyzer(
	config: MedicationAnalyzerConfig,
): MedicationAnalyzer {
	return new MedicationAnalyzer(config);
}

