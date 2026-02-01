'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GraphLegend() {
  return (
    <Card className="absolute bottom-4 left-4 z-10 w-64 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Connection Severity
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-[#ef4444]" />
              <span className="text-xs">Dangerous - Avoid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-[#eab308]" />
              <span className="text-xs">Moderate - Monitor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-[#22c55e]" />
              <span className="text-xs">Safe - Minor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-[#3b82f6]" />
              <span className="text-xs">Potential - Monitor</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Node Confidence
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#22c55e]" />
              <span className="text-xs">High Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#eab308]" />
              <span className="text-xs">Medium Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
              <span className="text-xs">Low Confidence</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Node Size
          </h4>
          <p className="text-xs text-muted-foreground">
            Larger nodes have more known interactions
          </p>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            <strong>Controls:</strong> Drag to rotate, scroll to zoom, click
            nodes to highlight connections
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
