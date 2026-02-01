export interface InsightsData {
  totalMedications: number;
  averageSafetyScore: number;
  conditionCoverage: { name: string; value: number }[];
  warningsBySeverity: {
    critical: number;
    moderate: number;
    minor: number;
  };
  confidenceTrend: {
    date: string;
    confidence: number;
    medication: string;
  }[];
  medicationTimeline: {
    date: number;
    medication: string;
    confidence: number;
    warningCount: number;
  }[];
  totalWarnings: number;
  totalInteractions: number;
  topWarnings: {
    text: string;
    medicationName: string;
  }[];
}
