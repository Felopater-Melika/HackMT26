'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { InsightCard } from './InsightCard';
import { Heart } from 'lucide-react';

interface ConditionCoverageChartProps {
  data: { name: string; value: number }[];
  delay?: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#84cc16', // lime
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

  // Limit to top 6 conditions for readability
  const displayData = data.slice(0, 6);

  return (
    <InsightCard title="Conditions Treated" icon={Heart} delay={delay}>
      <div className="flex flex-col gap-4">
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                animationBegin={delay}
                animationDuration={800}
              >
                {displayData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                itemStyle={{
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend below chart */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {displayData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground truncate" title={item.name}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </InsightCard>
  );
}
