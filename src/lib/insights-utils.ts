import type { InsightsData } from '@/types/insights';
import type { DeepDiveWithMedication } from '@/types/graph';

/**
 * Calculates all insight metrics from deep-dive data
 */
export function calculateInsights(
  deepDives: DeepDiveWithMedication[] | undefined
): InsightsData {
  if (!deepDives || deepDives.length === 0) {
    return {
      totalMedications: 0,
      averageSafetyScore: 0,
      conditionCoverage: [],
      warningsBySeverity: { critical: 0, moderate: 0, minor: 0 },
      confidenceTrend: [],
      medicationTimeline: [],
      totalWarnings: 0,
      totalInteractions: 0,
      topWarnings: [],
    };
  }

  // Calculate average safety score (from confidence levels)
  const averageSafetyScore = calculateAverageSafetyScore(deepDives);

  // Aggregate conditions
  const conditionCoverage = aggregateConditions(deepDives);

  // Categorize warnings
  const warningsBySeverity = categorizeWarnings(deepDives);

  // Build confidence trend
  const confidenceTrend = buildConfidenceTrend(deepDives);

  // Build medication timeline
  const medicationTimeline = buildMedicationTimeline(deepDives);

  // Count totals
  const totalWarnings = deepDives.reduce(
    (sum, dd) => sum + ((dd.personalizedWarnings as string[])?.length || 0),
    0
  );
  const totalInteractions = deepDives.reduce(
    (sum, dd) => sum + ((dd.interactions as string[])?.length || 0),
    0
  );

  // Get top warnings
  const topWarnings = getTopWarnings(deepDives);

  return {
    totalMedications: deepDives.length,
    averageSafetyScore,
    conditionCoverage,
    warningsBySeverity,
    confidenceTrend,
    medicationTimeline,
    totalWarnings,
    totalInteractions,
    topWarnings,
  };
}

/**
 * Converts confidence level to numerical score (0-100)
 */
export function confidenceToScore(
  confidence: { overall: string } | null
): number {
  if (!confidence) return 50;
  switch (confidence.overall) {
    case 'high':
      return 90;
    case 'medium':
      return 70;
    case 'low':
      return 40;
    default:
      return 50;
  }
}

/**
 * Calculates average safety score from all medications
 */
function calculateAverageSafetyScore(
  deepDives: DeepDiveWithMedication[]
): number {
  if (deepDives.length === 0) return 0;

  let totalScore = 0;

  deepDives.forEach((dd) => {
    const confidence = dd.confidence as { overall: string } | null;
    const warnings = (dd.personalizedWarnings as string[]) || [];
    const sideEffects = dd.sideEffects as { serious?: string[] } | null;
    const seriousSideEffects = sideEffects?.serious?.length || 0;

    // Start with confidence-based score
    let score = confidenceToScore(confidence);

    // Deduct points for warnings and serious side effects
    score -= warnings.length * 3;
    score -= seriousSideEffects * 5;

    // Clamp between 0 and 100
    score = Math.max(0, Math.min(100, score));
    totalScore += score;
  });

  return Math.round(totalScore / deepDives.length);
}

/**
 * Aggregates all conditions across medications into chart data
 */
function aggregateConditions(
  deepDives: DeepDiveWithMedication[]
): { name: string; value: number }[] {
  const conditionCounts = new Map<string, number>();

  deepDives.forEach((dd) => {
    const conditions = (dd.whatItTreats as string[]) || [];
    conditions.forEach((condition) => {
      // Clean up and normalize condition name
      const normalized = condition
        .toLowerCase()
        .trim()
        .replace(/[.]/g, '')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      conditionCounts.set(normalized, (conditionCounts.get(normalized) || 0) + 1);
    });
  });

  return Array.from(conditionCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 conditions
}

/**
 * Categorizes warnings by severity level
 */
function categorizeWarnings(deepDives: DeepDiveWithMedication[]): {
  critical: number;
  moderate: number;
  minor: number;
} {
  let critical = 0;
  let moderate = 0;
  let minor = 0;

  deepDives.forEach((dd) => {
    const warnings = (dd.personalizedWarnings as string[]) || [];
    const sideEffects = dd.sideEffects as {
      serious?: string[];
      common?: string[];
    } | null;
    const seriousSideEffects = sideEffects?.serious || [];

    // Serious side effects count as critical
    critical += seriousSideEffects.length;

    warnings.forEach((warning) => {
      const text = warning.toLowerCase();
      if (
        text.includes('severe') ||
        text.includes('emergency') ||
        text.includes('stop') ||
        text.includes('immediately') ||
        text.includes('seek') ||
        text.includes('dangerous') ||
        text.includes('life-threatening')
      ) {
        critical++;
      } else if (
        text.includes('caution') ||
        text.includes('monitor') ||
        text.includes('may') ||
        text.includes('avoid') ||
        text.includes('consult')
      ) {
        moderate++;
      } else {
        minor++;
      }
    });
  });

  return { critical, moderate, minor };
}

/**
 * Builds confidence trend data over time
 */
function buildConfidenceTrend(
  deepDives: DeepDiveWithMedication[]
): { date: string; confidence: number; medication: string }[] {
  return deepDives
    .filter((dd) => dd.createdAt)
    .sort(
      (a, b) =>
        new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    )
    .map((dd) => ({
      date: new Date(dd.createdAt!).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      confidence: confidenceToScore(dd.confidence as { overall: string } | null),
      medication: dd.medication?.brandName || dd.medication?.name || 'Unknown',
    }));
}

/**
 * Builds medication timeline data
 */
function buildMedicationTimeline(
  deepDives: DeepDiveWithMedication[]
): { date: number; medication: string; confidence: number; warningCount: number }[] {
  return deepDives
    .filter((dd) => dd.createdAt)
    .map((dd) => ({
      date: new Date(dd.createdAt!).getTime(),
      medication: dd.medication?.brandName || dd.medication?.name || 'Unknown',
      confidence: confidenceToScore(dd.confidence as { overall: string } | null),
      warningCount: ((dd.personalizedWarnings as string[]) || []).length,
    }));
}

/**
 * Gets the top warnings across all medications
 */
function getTopWarnings(
  deepDives: DeepDiveWithMedication[]
): { text: string; medicationName: string }[] {
  const warnings: { text: string; medicationName: string; priority: number }[] = [];

  deepDives.forEach((dd) => {
    const medicationName =
      dd.medication?.brandName || dd.medication?.name || 'Unknown';
    const ddWarnings = (dd.personalizedWarnings as string[]) || [];
    const sideEffects = dd.sideEffects as { serious?: string[] } | null;
    const seriousSideEffects = sideEffects?.serious || [];

    // Add serious side effects with high priority
    seriousSideEffects.forEach((warning) => {
      warnings.push({
        text: warning,
        medicationName,
        priority: 3,
      });
    });

    // Add personalized warnings
    ddWarnings.forEach((warning) => {
      const text = warning.toLowerCase();
      let priority = 1;
      if (
        text.includes('severe') ||
        text.includes('emergency') ||
        text.includes('immediately')
      ) {
        priority = 3;
      } else if (
        text.includes('caution') ||
        text.includes('monitor') ||
        text.includes('avoid')
      ) {
        priority = 2;
      }
      warnings.push({
        text: warning,
        medicationName,
        priority,
      });
    });
  });

  return warnings
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(({ text, medicationName }) => ({ text, medicationName }));
}

/**
 * Gets color for safety score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#eab308'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Gets description for safety score
 */
export function getScoreDescription(score: number): string {
  if (score >= 80) return 'Excellent - Low risk profile';
  if (score >= 60) return 'Good - Some precautions needed';
  if (score >= 40) return 'Moderate - Monitor closely';
  return 'High Risk - Consult your doctor';
}
