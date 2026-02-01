'use client';

import { useEffect, useState } from 'react';
import { InsightCard } from './InsightCard';
import { Pill, AlertTriangle, Activity } from 'lucide-react';

interface MedicationCountCardProps {
  totalMedications: number;
  totalWarnings: number;
  totalInteractions: number;
  delay?: number;
}

export function MedicationCountCard({
  totalMedications,
  totalWarnings,
  totalInteractions,
  delay = 0,
}: MedicationCountCardProps) {
  const [displayCount, setDisplayCount] = useState(0);

  // Animate the count
  useEffect(() => {
    if (totalMedications === 0) return;

    const duration = 1000; // 1 second
    const steps = 20;
    const increment = totalMedications / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalMedications) {
        setDisplayCount(totalMedications);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalMedications]);

  return (
    <InsightCard title="Active Medications" icon={Pill} delay={delay}>
      <div className="flex flex-col items-center">
        <div className="text-6xl font-bold text-primary">{displayCount}</div>
        <p className="text-sm text-muted-foreground">medications being monitored</p>

        <div className="mt-6 w-full space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Total Warnings</span>
            </div>
            <span className="font-semibold">{totalWarnings}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Total Interactions</span>
            </div>
            <span className="font-semibold">{totalInteractions}</span>
          </div>
        </div>
      </div>
    </InsightCard>
  );
}
