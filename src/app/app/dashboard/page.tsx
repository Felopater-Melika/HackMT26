'use client';

import { Nav } from '@/components/Nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pill,
  Plus,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { MedicationTypeSearch } from '@/components/MedicationTypeSearch';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { data: reports, isLoading } = api.reports.getAll.useQuery();
  const { data: usage } = api.usage.getUsage.useQuery();
  const utils = api.useUtils();
  // Get all deep-dives to check which medications have reports
  const { data: deepDives } = api.medicationDeepDive.getAll.useQuery();

  // Create a map of medication name (lowercase) to deep-dive for quick lookup
  const deepDiveByMedName = useMemo(() => {
    const map = new Map<string, { id: string; medicationId: string }>();
    deepDives?.forEach((dd) => {
      const name = dd.medication?.brandName || dd.medication?.name;
      if (name) {
        map.set(name.toLowerCase(), {
          id: dd.id,
          medicationId: dd.medicationId,
        });
      }
    });
    return map;
  }, [deepDives]);

  // Helper to check if a medication has an existing report
  const getExistingReport = (medicationName: string) => {
    return deepDiveByMedName.get(medicationName.toLowerCase());
  };

  const [expandedReports, setExpandedReports] = useState<Set<string>>(
    new Set()
  );

  const {
    mutate: analyzeMedication,
    isPending: isSearching,
    data: searchResult,
  } = api.medications.analyze.useMutation({
    onSuccess: (data) => {
      utils.reports.getAll.invalidate();
      toast.success('Analysis complete. Report saved to your history.');
      if (data.reportId) {
        setExpandedReports((prev) =>
          new Set(prev).add(data.reportId as string)
        );
      }
    },
    onError: (err) => {
      toast.error(err.message ?? 'Analysis failed');
    },
  });

  const toggleReport = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  return (
    <div className='min-h-screen bg-background'>
      <Nav />
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='font-bold text-3xl text-foreground'>Dashboard</h1>
            <p className='text-muted-foreground'>
              View your medication analysis history
            </p>
          </div>
          <Link href='/app/scan'>
            <Button disabled={usage?.hasReachedLimit}>
              <Plus className='mr-2 h-4 w-4' />
              New Scan
            </Button>
          </Link>
        </div>

        {/* Type Medication Search Bar */}
        <Card className='mb-6 border'>
          <div className='p-4'>
            <MedicationTypeSearch
              onSelect={(name) =>
                analyzeMedication({
                  medications: [
                    { name, dosage: null, measurement: null, ocrLines: [] },
                  ],
                })
              }
              placeholder='e.g. aspirin, metformin, ibuprofen'
              submitLabel='Analyze'
              disabled={usage?.hasReachedLimit}
              isPending={isSearching}
              mode='analyze'
            />
            {usage?.hasReachedLimit && (
              <p className='mt-2 text-destructive text-xs'>
                You've reached your scan limit. Upgrade to search more.
              </p>
            )}
          </div>
        </Card>

        {/* Search result (same format as scan report) */}
        {searchResult?.individualResults?.length > 0 && (
          <Card className='mb-6 border-2 border-primary/20'>
            <div className='border-b p-4'>
              <h3 className='font-semibold text-foreground'>
                Search result:{' '}
                {searchResult.individualResults[0]?.medicationName}
              </h3>
              <p className='text-muted-foreground text-sm'>
                This report has been saved to your history below.
              </p>
            </div>
            <div className='p-6'>
              {searchResult.individualResults.map((med: any, index: number) => (
                <Card key={index} className='border bg-card p-4'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div>
                      <h5 className='font-semibold text-foreground'>
                        {med.medicationName}
                      </h5>
                      {med.dosage != null && med.measurement && (
                        <p className='text-muted-foreground text-sm'>
                          {med.dosage} {med.measurement}
                        </p>
                      )}
                    </div>
                    {med.success && (
                      <div className='text-right'>
                        <div className='font-bold text-2xl text-foreground'>
                          {med.safetyScore}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          Safety Score
                        </div>
                      </div>
                    )}
                  </div>
                  {med.success ? (
                    <>
                      {med.summary && (
                        <div className='mb-3 rounded-md bg-muted p-3'>
                          <p className='text-sm leading-relaxed'>
                            {med.summary}
                          </p>
                        </div>
                      )}
                      {med.warnings?.length > 0 && (
                        <div className='mb-3'>
                          <h6 className='mb-2 flex items-center gap-2 font-semibold text-sm'>
                            <AlertCircle className='h-4 w-4' />
                            Warnings
                          </h6>
                          <ul className='space-y-1'>
                            {med.warnings.map((warning: string, i: number) => (
                              <li
                                key={i}
                                className='rounded-md border bg-card px-3 py-2 text-sm'>
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {med.interactions?.length > 0 && (
                        <div className='mb-3'>
                          <h6 className='mb-2 font-semibold text-sm'>
                            Potential Interactions
                          </h6>
                          <ul className='space-y-1'>
                            {med.interactions.map((int: string, i: number) => (
                              <li
                                key={i}
                                className='rounded-md border bg-card px-3 py-2 text-sm'>
                                {int}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {med.recommendations?.length > 0 && (
                        <div>
                          <h6 className='mb-2 font-semibold text-sm'>
                            Recommendations
                          </h6>
                          <ul className='space-y-1'>
                            {med.recommendations.map(
                              (rec: string, i: number) => (
                                <li
                                  key={i}
                                  className='rounded-md border bg-card px-3 py-2 text-sm'>
                                  {rec}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='rounded-md bg-destructive/10 p-3'>
                      <p className='font-medium text-destructive text-sm'>
                        Analysis Failed: {med.error}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Usage Card */}
        {usage && (
          <Card className='mb-6 border'>
            <div className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='mb-1 font-semibold text-sm text-foreground'>
                    Scan Usage
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {usage.hasReachedLimit
                      ? "You've reached your limit"
                      : `${usage.remaining} scan${
                          usage.remaining !== 1 ? 's' : ''
                        } remaining`}
                  </p>
                </div>
                <div className='text-right'>
                  <div
                    className={`font-bold text-2xl ${
                      usage.hasReachedLimit
                        ? 'text-destructive'
                        : usage.remaining === 1
                        ? 'text-yellow-600'
                        : 'text-primary'
                    }`}>
                    {usage.remaining} / {usage.limit}
                  </div>
                </div>
              </div>
              {usage.hasReachedLimit && (
                <div className='mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
                  ⚠️ You've used all {usage.limit} scans. Upgrade to continue
                  analyzing medications.
                </div>
              )}
            </div>
          </Card>
        )}

        {isLoading ? (
          <Card className='border p-8 text-center'>
            <p className='text-muted-foreground'>Loading your reports...</p>
          </Card>
        ) : !reports || reports.length === 0 ? (
          <Card className='border p-8 text-center'>
            <Pill className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
            <h2 className='mb-2 font-semibold text-xl'>No scans yet</h2>
            <p className='mb-4 text-muted-foreground'>
              Start by scanning your medications to get personalized analysis
            </p>
            <Link href='/app/scan'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Scan Medications
              </Button>
            </Link>
          </Card>
        ) : (
          <div className='space-y-4'>
            {reports.map((report) => {
              const analysisData = report.rawJson as any;
              const isExpanded = expandedReports.has(report.id);

              return (
                <Card key={report.id} className='border'>
                  {/* Header - Always visible */}
                  <div
                    className='flex cursor-pointer items-center justify-between p-6 hover:bg-accent/50'
                    onClick={() => toggleReport(report.id)}>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-4'>
                        <h3 className='font-semibold text-lg text-foreground'>
                          {report.summary}
                        </h3>
                        {analysisData?.summary?.requiresAttention && (
                          <span className='flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-destructive text-xs'>
                            <AlertCircle className='h-3 w-3' />
                            Attention Required
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-4 text-muted-foreground text-sm'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          {new Date(
                            report.createdAt || ''
                          ).toLocaleDateString()}
                        </span>
                        <span className='flex items-center gap-1'>
                          <Pill className='h-4 w-4' />
                          {analysisData?.summary?.totalMedications || 0}{' '}
                          medication(s)
                        </span>
                        <span>
                          Safety Score:{' '}
                          <span className='font-semibold text-foreground'>
                            {analysisData?.summary?.averageSafetyScore || 0}
                            /100
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='ghost' size='icon'>
                        {isExpanded ? (
                          <ChevronUp className='h-5 w-5' />
                        ) : (
                          <ChevronDown className='h-5 w-5' />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className='border-t p-6'>
                      {/* Individual Medications */}
                      <div className='space-y-4'>
                        <h4 className='font-semibold text-foreground'>
                          Individual Medications
                        </h4>

                        {analysisData?.individualResults?.map(
                          (med: any, index: number) => (
                            <Card key={index} className='border bg-card p-4'>
                              <div className='mb-3 flex items-start justify-between'>
                                <div>
                                  <h5 className='font-semibold text-foreground'>
                                    {med.medicationName}
                                  </h5>
                                  {med.dosage && med.measurement && (
                                    <p className='text-muted-foreground text-sm'>
                                      {med.dosage} {med.measurement}
                                    </p>
                                  )}
                                </div>
                                {med.success && (
                                  <div className='flex items-center gap-3'>
                                    {(() => {
                                      const existingReport = getExistingReport(
                                        med.medicationName
                                      );
                                      return existingReport ? (
                                        <Link
                                          href={`/app/medications/${existingReport.medicationId}/deep-dive`}
                                          title='View Detailed Report'>
                                          <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8 text-green-600 hover:text-green-700'>
                                            <CheckCircle className='h-4 w-4' />
                                          </Button>
                                        </Link>
                                      ) : (
                                        <Link
                                          href={`/app/medications/new/deep-dive?medicationName=${encodeURIComponent(
                                            med.medicationName
                                          )}&scanId=${report.id}`}
                                          title='Generate Detailed Report'>
                                          <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8 text-muted-foreground hover:text-primary'>
                                            <FileText className='h-4 w-4' />
                                          </Button>
                                        </Link>
                                      );
                                    })()}
                                    <div className='text-right'>
                                      <div className='font-bold text-2xl text-foreground'>
                                        {med.safetyScore}
                                      </div>
                                      <div className='text-muted-foreground text-xs'>
                                        Safety Score
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {med.success ? (
                                <>
                                  {med.summary && (
                                    <div className='mb-3 rounded-md bg-muted p-3'>
                                      <p className='text-sm leading-relaxed'>
                                        {med.summary}
                                      </p>
                                    </div>
                                  )}

                                  {med.warnings && med.warnings.length > 0 && (
                                    <div className='mb-3'>
                                      <h6 className='mb-2 flex items-center gap-2 font-semibold text-sm'>
                                        <AlertCircle className='h-4 w-4' />
                                        Warnings
                                      </h6>
                                      <ul className='space-y-1'>
                                        {med.warnings.map(
                                          (warning: string, i: number) => (
                                            <li
                                              key={i}
                                              className='rounded-md border bg-card px-3 py-2 text-sm'>
                                              {warning}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {med.recommendations &&
                                    med.recommendations.length > 0 && (
                                      <div>
                                        <h6 className='mb-2 font-semibold text-sm'>
                                          Recommendations
                                        </h6>
                                        <ul className='space-y-1'>
                                          {med.recommendations.map(
                                            (rec: string, i: number) => (
                                              <li
                                                key={i}
                                                className='rounded-md border bg-card px-3 py-2 text-sm'>
                                                {rec}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Detailed Report Button */}
                                  <div className='mt-4 pt-4 border-t'>
                                    {(() => {
                                      const existingReport = getExistingReport(
                                        med.medicationName
                                      );
                                      return existingReport ? (
                                        <Link
                                          href={`/app/medications/${existingReport.medicationId}/deep-dive`}>
                                          <Button
                                            variant='outline'
                                            size='sm'
                                            className='w-full'>
                                            <CheckCircle className='mr-2 h-4 w-4 text-green-600' />
                                            View Detailed Report
                                          </Button>
                                        </Link>
                                      ) : (
                                        <Link
                                          href={`/app/medications/new/deep-dive?medicationName=${encodeURIComponent(
                                            med.medicationName
                                          )}&scanId=${report.id}`}>
                                          <Button
                                            variant='outline'
                                            size='sm'
                                            className='w-full'>
                                            <FileText className='mr-2 h-4 w-4' />
                                            Generate Report
                                          </Button>
                                        </Link>
                                      );
                                    })()}
                                  </div>
                                </>
                              ) : (
                                <div className='rounded-md bg-destructive/10 p-3'>
                                  <p className='font-medium text-destructive text-sm'>
                                    Analysis Failed: {med.error}
                                  </p>
                                </div>
                              )}
                            </Card>
                          )
                        )}
                      </div>

                      {/* Drug Interaction Analysis */}
                      {analysisData?.interactionAnalysis && (
                        <Card className='mt-4 border-2 border-primary/20 bg-primary/5 p-4'>
                          <h4 className='mb-3 flex items-center gap-2 font-semibold'>
                            <AlertCircle className='h-5 w-5 text-primary' />
                            Drug Interaction Analysis
                          </h4>

                          <div className='mb-3 rounded-md bg-background p-3'>
                            <p className='text-sm leading-relaxed'>
                              {analysisData.interactionAnalysis.summary}
                            </p>
                          </div>

                          {analysisData.interactionAnalysis.interactions
                            .length > 0 && (
                            <div className='mb-3'>
                              <h6 className='mb-2 font-semibold text-sm'>
                                Interactions Found
                              </h6>
                              <ul className='space-y-1'>
                                {analysisData.interactionAnalysis.interactions.map(
                                  (int: string, i: number) => (
                                    <li
                                      key={i}
                                      className='rounded-md border bg-card px-3 py-2 text-sm'>
                                      {int}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {analysisData.interactionAnalysis.recommendations
                            .length > 0 && (
                            <div>
                              <h6 className='mb-2 font-semibold text-sm'>
                                Recommendations
                              </h6>
                              <ul className='space-y-1'>
                                {analysisData.interactionAnalysis.recommendations.map(
                                  (rec: string, i: number) => (
                                    <li
                                      key={i}
                                      className='rounded-md border bg-card px-3 py-2 text-sm'>
                                      {rec}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </Card>
                      )}

                      {/* Disclaimer */}
                      <Card className='mt-4 border bg-muted p-3'>
                        <p className='text-muted-foreground text-xs'>
                          <strong>Disclaimer:</strong> This analysis is for
                          informational purposes only and does not constitute
                          medical advice.
                        </p>
                      </Card>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
