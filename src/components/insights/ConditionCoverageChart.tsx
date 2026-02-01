'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InsightCard } from './InsightCard';
import { Heart } from 'lucide-react';

interface ConditionCoverageChartProps {
  data: { name: string; value: number }[];
  delay?: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export function ConditionCoverageChart({ data, delay = 0 }: ConditionCoverageChartProps) {
  if (data.length === 0) {
    return (
      <InsightCard title="Conditions Treated" icon={Heart} delay={delay}>
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          No conditions data available
        </div>
      </InsightCard>
    );
  }

  return (
    <InsightCard title="Conditions Treated" icon={Heart} delay={delay}>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationBegin={delay}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </InsightCard>
  );
}
