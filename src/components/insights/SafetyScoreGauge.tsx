'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { getScoreColor, getScoreDescription } from '@/lib/insights-utils';
import { InsightCard } from './InsightCard';
import { Shield } from 'lucide-react';

interface SafetyScoreGaugeProps {
  score: number;
  delay?: number;
}

export function SafetyScoreGauge({ score, delay = 0 }: SafetyScoreGaugeProps) {
  const data = [
    {
      name: 'Safety',
      value: score,
      fill: getScoreColor(score),
    },
  ];

  return (
    <InsightCard title="Overall Safety Score" icon={Shield} delay={delay}>
      <div className="flex flex-col items-center">
        <div className="relative h-[180px] w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={15}
              data={data}
              startAngle={180}
              endAngle={-180}
            >
              <RadialBar
                background={{ fill: 'hsl(var(--muted))' }}
                dataKey="value"
                cornerRadius={10}
                max={100}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-bold"
              style={{ color: getScoreColor(score) }}
            >
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {getScoreDescription(score)}
        </p>
      </div>
    </InsightCard>
  );
}
