/**
 * Medication Analysis tRPC Router
 * 
 * Provides endpoints for AI-powered medication analysis using Azure OpenAI
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { createMedicationAnalyzer } from "@/lib/medication-analyzer";
import { env } from "@/env";

export const medicationAnalysisRouter = createTRPCRouter({
	/**
	 * Test Azure OpenAI configuration
	 */
	testConfig: publicProcedure.query(async () => {
		const instanceName = env.AZURE_AI_ENDPOINT
			.replace("https://", "")
			.replace("http://", "")
			.split(".")[0];

		return {
			configured: true,
			instanceName,
			deployment: env.AZURE_AI_DEPLOYMENT,
			apiVersion: env.AZURE_AI_API_VERSION,
			endpoint: env.AZURE_AI_ENDPOINT,
			region: env.AZURE_AI_REGION,
			// Don't expose the actual key
			hasApiKey: !!env.AZURE_AI_API_KEY,
		};
	}),

	/**
	 * Analyzes a single medication for the authenticated user
	 */
	analyzeSingle: protectedProcedure
		.input(
			z.object({
				medicationName: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const analyzer = createMedicationAnalyzer({
				userId: ctx.session.user.id,
				temperature: 0.3,
			});

			const result = await analyzer.analyzeMedication(input.medicationName);

			return result;
		}),

	/**
	 * Analyzes multiple medications for interactions
	 */
	analyzeMultiple: protectedProcedure
		.input(
			z.object({
				medicationNames: z.array(z.string().min(1)).min(2),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const analyzer = createMedicationAnalyzer({
				userId: ctx.session.user.id,
				temperature: 0.3,
			});

			const result = await analyzer.analyzeMultipleMedications(
				input.medicationNames,
			);

			return result;
		}),

	/**
	 * Analyzes a scanned medication with patient context
	 */
	analyzeScannedMedication: protectedProcedure
		.input(
			z.object({
				medicationName: z.string().min(1),
				scanId: z.string().optional(),
				additionalContext: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const analyzer = createMedicationAnalyzer({
				userId: ctx.session.user.id,
				temperature: 0.3,
			});

			// Analyze the medication
			const result = await analyzer.analyzeMedication(input.medicationName);

			// TODO: If scanId is provided, save the analysis to the reports table
			// This would link the analysis to the specific scan

			return {
				...result,
				scanId: input.scanId,
			};
		}),

	/**
	 * Gets a quick safety check for a medication
	 */
	quickSafetyCheck: protectedProcedure
		.input(
			z.object({
				medicationName: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			const analyzer = createMedicationAnalyzer({
				userId: ctx.session.user.id,
				temperature: 0.2,
				maxTokens: 1000,
			});

			const result = await analyzer.analyzeMedication(input.medicationName);

			// Return a simplified response for quick checks
			return {
				medicationName: result.medicationName,
				safetyScore: result.safetyScore,
				requiresAttention: result.requiresAttention,
				topWarnings: result.warnings.slice(0, 3),
				topInteractions: result.interactions.slice(0, 3),
				quickRecommendation:
					result.recommendations[0] || "Consult with your healthcare provider.",
			};
		}),
});

