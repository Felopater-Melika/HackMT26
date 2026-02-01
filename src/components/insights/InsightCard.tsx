'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InsightCardProps {
  title: string;
  icon: LucideIcon;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export function InsightCard({
  title,
  icon: Icon,
  delay = 0,
  children,
  className,
}: InsightCardProps) {
  return (
    <Card
      className={cn(
        'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
