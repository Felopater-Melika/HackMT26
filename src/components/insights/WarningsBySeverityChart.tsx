'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { InsightCard } from './InsightCard';
import { AlertTriangle } from 'lucide-react';

interface WarningsBySeverityChartProps {
  data: {
    critical: number;
    moderate: number;
    minor: number;
  };
  topWarnings: { text: string; medicationName: string }[];
  delay?: number;
}

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  Moderate: '#eab308',
  Minor: '#22c55e',
};

export function WarningsBySeverityChart({
  data,
  topWarnings,
  delay = 0,
}: WarningsBySeverityChartProps) {
  const chartData = [
    { severity: 'Critical', count: data.critical, fill: SEVERITY_COLORS.Critical },
    { severity: 'Moderate', count: data.moderate, fill: SEVERITY_COLORS.Moderate },
    { severity: 'Minor', count: data.minor, fill: SEVERITY_COLORS.Minor },
  ];

  const totalWarnings = data.critical + data.moderate + data.minor;

  return (
    <InsightCard
      title="Warnings by Severity"
      icon={AlertTriangle}
      delay={delay}
      className="col-span-1 md:col-span-2"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" />
              <YAxis dataKey="severity" type="category" width={70} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                animationDuration={1000}
                animationBegin={delay}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">
            Top Warnings ({totalWarnings} total)
          </h4>
          {topWarnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warnings found</p>
          ) : (
            topWarnings.slice(0, 3).map((warning, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium line-clamp-2">
                    {warning.text}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    From: {warning.medicationName}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </InsightCard>
  );
}
