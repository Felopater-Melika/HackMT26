'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { InsightCard } from './InsightCard';
import { TrendingUp } from 'lucide-react';

interface ConfidenceTrendChartProps {
  data: { date: string; confidence: number; medication: string }[];
  delay?: number;
}

export function ConfidenceTrendChart({ data, delay = 0 }: ConfidenceTrendChartProps) {
  if (data.length === 0) {
    return (
      <InsightCard title="Confidence Trends" icon={TrendingUp} delay={delay}>
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          Not enough data to show trends
        </div>
      </InsightCard>
    );
  }

  const avgConfidence =
    data.reduce((sum, d) => sum + d.confidence, 0) / data.length;
  const trend =
    data.length > 1 ? data[data.length - 1]!.confidence - data[0]!.confidence : 0;

  return (
    <InsightCard title="Confidence Trends" icon={TrendingUp} delay={delay}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload as {
                    medication: string;
                    date: string;
                    confidence: number;
                  };
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-semibold">{data.medication}</p>
                      <p className="text-sm text-muted-foreground">{data.date}</p>
                      <p className="mt-1 text-sm">
                        Confidence:{' '}
                        <span className="font-bold">{data.confidence}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 5 }}
              activeDot={{ r: 8 }}
              animationDuration={1500}
              animationBegin={delay}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-3">
        <p className="text-sm">
          <span className="font-semibold">Insight:</span> Average confidence is{' '}
          <span className="font-bold">{Math.round(avgConfidence)}%</span>
          {trend !== 0 && (
            <>
              {' '}
              with a{' '}
              <span
                className={trend > 0 ? 'text-green-600' : 'text-red-600'}
              >
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>{' '}
              change over time.
            </>
          )}
        </p>
      </div>
    </InsightCard>
  );
}
