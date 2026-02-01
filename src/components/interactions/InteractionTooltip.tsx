'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, Shield } from 'lucide-react';
import type { GraphNode } from '@/types/graph';

interface InteractionTooltipProps {
  node: GraphNode | null;
  position: { x: number; y: number };
}

export function InteractionTooltip({ node, position }: InteractionTooltipProps) {
  if (!node || !position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    return null;
  }

  const getConfidenceLabel = (confidence: { overall: string } | null) => {
    if (!confidence) return 'Unknown';
    return confidence.overall.charAt(0).toUpperCase() + confidence.overall.slice(1);
  };

  const getConfidenceColor = (confidence: { overall: string } | null) => {
    if (!confidence) return 'text-muted-foreground';
    switch (confidence.overall) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card
      className="pointer-events-none fixed z-50 w-72 bg-background/95 shadow-xl backdrop-blur"
      style={{
        left: position.x + 15,
        top: position.y + 15,
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{node.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {node.interactions.length} interaction
              {node.interactions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className={`text-sm font-medium ${getConfidenceColor(node.confidence)}`}>
              {getConfidenceLabel(node.confidence)}
            </span>
          </div>
        </div>

        {node.interactions.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
              Known Interactions
            </h4>
            <ul className="space-y-1">
              {node.interactions.slice(0, 3).map((interaction, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 block h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />
                  <span className="line-clamp-2">{interaction}</span>
                </li>
              ))}
              {node.interactions.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  ...and {node.interactions.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {node.warnings && node.warnings.length > 0 && (
          <div className="rounded-md bg-destructive/10 p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                {node.warnings.length} warning{node.warnings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Click to highlight all connections
        </p>
      </CardContent>
    </Card>
  );
}
