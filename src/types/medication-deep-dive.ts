import { z } from "zod";

/**
 * How to Take schema
 * Instructions for taking the medication
 */
export const howToTakeSchema = z.object({
	timing: z.string(), // When to take (e.g., "morning", "evening", "with meals")
	withFood: z.string(), // Food instructions (e.g., "take with food", "empty stomach")
	missedDose: z.string(), // What to do if you miss a dose
});

/**
 * Side Effects schema
 * Common and serious side effects
 */
export const sideEffectsSchema = z.object({
	common: z.array(z.string()), // Common side effects (e.g., nausea, headache)
	serious: z.array(z.string()), // Serious side effects requiring medical attention
});

/**
 * Confidence schema
 * Indicates confidence level in the analysis
 */
export const confidenceSchema = z.object({
	overall: z.enum(["low", "medium", "high"]),
	reason: z.string(), // Explanation for the confidence level
});

/**
 * Sources Used schema
 * Indicates which data sources were available for the analysis
 */
export const sourcesUsedSchema = z.object({
	scanLabel: z.boolean(), // Whether scanned label text was available
	openFda: z.boolean(), // Whether OpenFDA data was available
	patientProfile: z.boolean(), // Whether patient profile data was available
});

/**
 * Complete Medication Deep-Dive Output schema
 * Comprehensive medication information with personalized insights
 */
export const medicationDeepDiveOutputSchema = z.object({
	summary: z.string(), // Brief 2-3 sentence overview
	whatItTreats: z.array(z.string()), // Conditions this medication treats
	howItWorks: z.string(), // Mechanism of action in patient-friendly language
	howToTake: howToTakeSchema, // Detailed usage instructions
	expectedTimeline: z.string(), // When to expect results and duration of use
	benefits: z.array(z.string()), // Benefits and expected positive outcomes
	sideEffects: sideEffectsSchema, // Common and serious side effects
	personalizedWarnings: z.array(z.string()), // Warnings specific to patient's profile
	interactions: z.array(z.string()), // Drug and food interactions
	lifestyle: z.array(z.string()), // Lifestyle considerations and recommendations
	monitoring: z.array(z.string()), // What to monitor while taking this medication
	questionsToAskDoctor: z.array(z.string()), // Suggested questions for healthcare provider
	confidence: confidenceSchema, // Confidence level in the analysis
	sourcesUsed: sourcesUsedSchema, // Which data sources were used
	disclaimer: z.string(), // Medical disclaimer text
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type HowToTake = z.infer<typeof howToTakeSchema>;
export type SideEffects = z.infer<typeof sideEffectsSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type SourcesUsed = z.infer<typeof sourcesUsedSchema>;
export type MedicationDeepDiveOutput = z.infer<
	typeof medicationDeepDiveOutputSchema
>;
