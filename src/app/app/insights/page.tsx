'use client';

import { useMemo } from 'react';
import { Nav } from '@/components/Nav';
import { Card } from '@/components/ui/card';
import { api } from '@/trpc/react';
import { calculateInsights } from '@/lib/insights-utils';
import type { DeepDiveWithMedication } from '@/types/graph';

import { SafetyScoreGauge } from '@/components/insights/SafetyScoreGauge';
import { MedicationCountCard } from '@/components/insights/MedicationCountCard';
import { ConditionCoverageChart } from '@/components/insights/ConditionCoverageChart';
import { WarningsBySeverityChart } from '@/components/insights/WarningsBySeverityChart';
import { ConfidenceTrendChart } from '@/components/insights/ConfidenceTrendChart';
import { MedicationTimeline } from '@/components/insights/MedicationTimeline';

import { BarChart3, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InsightsPage() {
  const { data: deepDives, isLoading, refetch } = api.medicationDeepDive.getAll.useQuery();

  // Transform API data to expected format
  const transformedDeepDives: DeepDiveWithMedication[] | undefined = useMemo(() => {
    if (!deepDives) return undefined;
    return deepDives.map((dd) => ({
      id: dd.id,
      medicationId: dd.medicationId,
      summary: dd.summary,
      whatItTreats: dd.whatItTreats,
      interactions: dd.interactions,
      personalizedWarnings: dd.personalizedWarnings,
      sideEffects: dd.sideEffects,
      confidence: dd.confidence,
      createdAt: dd.createdAt,
      medication: dd.medication,
    }));
  }, [deepDives]);

  const insights = useMemo(
    () => calculateInsights(transformedDeepDives),
    [transformedDeepDives]
  );

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <BarChart3 className="h-8 w-8 text-primary" />
              Medication Insights
            </h1>
            <p className="mt-1 text-muted-foreground">
              Analytics and trends for your medication portfolio
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading your insights...</p>
            </div>
          </div>
        ) : insights.totalMedications === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No Data Yet</h2>
            <p className="mb-6 text-muted-foreground">
              Analyze some medications to see your personalized insights and trends.
            </p>
            <Link href="/app/scan">
              <Button>Scan Your First Medication</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Row 1: Key metrics */}
            <SafetyScoreGauge score={insights.averageSafetyScore} delay={0} />
            <MedicationCountCard
              totalMedications={insights.totalMedications}
              totalWarnings={insights.totalWarnings}
              totalInteractions={insights.totalInteractions}
              delay={100}
            />
            <ConditionCoverageChart data={insights.conditionCoverage} delay={200} />

            {/* Row 2: Warnings and Trends */}
            <WarningsBySeverityChart
              data={insights.warningsBySeverity}
              topWarnings={insights.topWarnings}
              delay={300}
            />
            <ConfidenceTrendChart data={insights.confidenceTrend} delay={400} />

            {/* Row 3: Timeline */}
            <MedicationTimeline data={insights.medicationTimeline} delay={500} />
          </div>
        )}
      </div>
    </div>
  );
}
