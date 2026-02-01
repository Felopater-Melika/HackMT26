'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { InsightCard } from './InsightCard';
import { Calendar } from 'lucide-react';

interface MedicationTimelineProps {
  data: {
    date: number;
    medication: string;
    confidence: number;
    warningCount: number;
  }[];
  delay?: number;
}

function getColorByConfidence(confidence: number): string {
  if (confidence >= 80) return '#22c55e';
  if (confidence >= 60) return '#eab308';
  return '#ef4444';
}

export function MedicationTimeline({ data, delay = 0 }: MedicationTimelineProps) {
  if (data.length === 0) {
    return (
      <InsightCard
        title="Medication Timeline"
        icon={Calendar}
        delay={delay}
        className="col-span-1 md:col-span-2 lg:col-span-3"
      >
        <div className="flex h-[150px] items-center justify-center text-muted-foreground">
          No medication data available
        </div>
      </InsightCard>
    );
  }

  return (
    <InsightCard
      title="Medication Timeline"
      icon={Calendar}
      delay={delay}
      className="col-span-1 md:col-span-2 lg:col-span-3"
    >
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp: number) =>
                new Date(timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              tick={{ fontSize: 12 }}
            />
            <YAxis
              dataKey="warningCount"
              type="number"
              name="Warnings"
              tick={{ fontSize: 12 }}
              label={{
                value: 'Warnings',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <ZAxis dataKey="confidence" range={[100, 400]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload as {
                    medication: string;
                    date: number;
                    confidence: number;
                    warningCount: number;
                  };
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-semibold">{data.medication}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(data.date).toLocaleDateString()}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Warnings: {data.warningCount}</p>
                        <p>Confidence: {data.confidence}%</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              data={data}
              animationDuration={1000}
              animationBegin={delay}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorByConfidence(entry.confidence)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>High Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>Medium Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Low Confidence</span>
        </div>
      </div>
    </InsightCard>
  );
}
