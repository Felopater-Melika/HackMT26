/**
 * Type definitions for medication analysis responses
 * 
 * These types define the structured JSON format returned by the
 * medication analysis API for easy frontend parsing and display.
 */

/**
 * Individual medication analysis result
 */
export interface MedicationAnalysisResult {
	/** Name of the medication analyzed */
	medicationName: string;
	
	/** Dosage amount */
	dosage: number | null;
	
	/** Unit of measurement (mg, mcg, etc.) */
	measurement: string | null;
	
	/** Whether the analysis was successful */
	success: boolean;
	
	/** Error message if analysis failed */
	error?: string;
	
	/** Safety score from 0-100 (100 = safest) */
	safetyScore?: number;
	
	/** Whether this medication requires immediate attention */
	requiresAttention?: boolean;
	
	/** Brief 2-3 sentence summary of the analysis */
	summary?: string;
	
	/** List of patient-specific warnings (max 5) */
	warnings?: string[];
	
	/** List of drug interactions or contraindications (max 5) */
	interactions?: string[];
	
	/** List of actionable recommendations (max 5) */
	recommendations?: string[];
}

/**
 * Drug interaction analysis for multiple medications
 */
export interface InteractionAnalysis {
	/** List of medications analyzed together */
	medications: string[];
	
	/** Overall safety score when taking these together (0-100) */
	overallSafetyScore?: number;
	
	/** Whether the combination requires attention */
	requiresAttention?: boolean;
	
	/** Brief summary of combined risks */
	summary: string;
	
	/** List of drug-drug interactions found */
	interactions: string[];
	
	/** List of recommendations for taking these together */
	recommendations: string[];
}

/**
 * Summary statistics for the analysis batch
 */
export interface AnalysisSummary {
	/** Total number of medications submitted */
	totalMedications: number;
	
	/** Number successfully analyzed */
	analyzedSuccessfully: number;
	
	/** Whether any medication requires attention */
	requiresAttention: boolean;
	
	/** Average safety score across all medications */
	averageSafetyScore: number;
}

/**
 * Complete API response from medications.analyze endpoint
 */
export interface MedicationAnalysisResponse {
	/** Whether the API call was successful */
	success: boolean;
	
	/** Individual analysis for each medication */
	individualResults: MedicationAnalysisResult[];
	
	/** Interaction analysis (only if multiple medications) */
	interactionAnalysis: InteractionAnalysis | null;
	
	/** Summary statistics */
	summary: AnalysisSummary;
}

/**
 * Safety score interpretation
 */
export enum SafetyLevel {
	VERY_SAFE = "very_safe",      // 90-100
	SAFE = "safe",                // 70-89
	MODERATE = "moderate",        // 50-69
	CONCERNING = "concerning",    // 0-49
}

/**
 * Get safety level from score
 */
export function getSafetyLevel(score: number): SafetyLevel {
	if (score >= 90) return SafetyLevel.VERY_SAFE;
	if (score >= 70) return SafetyLevel.SAFE;
	if (score >= 50) return SafetyLevel.MODERATE;
	return SafetyLevel.CONCERNING;
}

/**
 * Get color for safety score display
 */
export function getSafetyColor(score: number): string {
	const level = getSafetyLevel(score);
	switch (level) {
		case SafetyLevel.VERY_SAFE:
			return "text-green-600";
		case SafetyLevel.SAFE:
			return "text-blue-600";
		case SafetyLevel.MODERATE:
			return "text-yellow-600";
		case SafetyLevel.CONCERNING:
			return "text-red-600";
	}
}

/**
 * Get badge color for safety score
 */
export function getSafetyBadgeColor(score: number): string {
	const level = getSafetyLevel(score);
	switch (level) {
		case SafetyLevel.VERY_SAFE:
			return "bg-green-100 text-green-800";
		case SafetyLevel.SAFE:
			return "bg-blue-100 text-blue-800";
		case SafetyLevel.MODERATE:
			return "bg-yellow-100 text-yellow-800";
		case SafetyLevel.CONCERNING:
			return "bg-red-100 text-red-800";
	}
}

