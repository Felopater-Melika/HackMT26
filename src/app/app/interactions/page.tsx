'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Nav } from '@/components/Nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { buildGraphData } from '@/lib/graph-utils';
import type { DeepDiveWithMedication, GraphNode } from '@/types/graph';

import { InteractionGraph3D } from '@/components/interactions/InteractionGraph3D';
import { InteractionGraph2D } from '@/components/interactions/InteractionGraph2D';
import { GraphLegend } from '@/components/interactions/GraphLegend';
import { InteractionTooltip } from '@/components/interactions/InteractionTooltip';

import { Network, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function InteractionsPage() {
  const { data: deepDives, isLoading } = api.medicationDeepDive.getAll.useQuery();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Transform API data
  const transformedDeepDives: DeepDiveWithMedication[] | undefined = useMemo(() => {
    if (!deepDives) return undefined;
    return deepDives.map((dd) => ({
      id: dd.id,
      medicationId: dd.medicationId,
      summary: dd.summary,
      whatItTreats: dd.whatItTreats,
      interactions: dd.interactions,
      personalizedWarnings: dd.personalizedWarnings,
      sideEffects: dd.sideEffects,
      confidence: dd.confidence,
      createdAt: dd.createdAt,
      medication: dd.medication,
    }));
  }, [deepDives]);

  // Build graph data
  const graphData = useMemo(() => {
    if (!transformedDeepDives) return { nodes: [], links: [] };
    return buildGraphData(transformedDeepDives);
  }, [transformedDeepDives]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const handleNodeHover = useCallback(
    (node: GraphNode | null, position: { x: number; y: number }) => {
      setHoveredNode(node);
      setTooltipPosition(position);
    },
    []
  );

  const handleReset = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNode(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const graphContainerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[#0a0a1a]'
    : 'relative h-[600px] overflow-hidden rounded-lg bg-[#0a0a1a]';

  return (
    <div className="min-h-screen bg-background">
      {!isFullscreen && <Nav />}
      <div className={isFullscreen ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        {/* Header */}
        {!isFullscreen && (
          <div className="mb-8">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <Network className="h-8 w-8 text-primary" />
              Drug Interaction Network
            </h1>
            <p className="mt-1 text-muted-foreground">
              Visualize how your medications interact with each other
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Building your interaction network...</p>
            </div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <Card className="p-12 text-center">
            <Network className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No Medications Yet</h2>
            <p className="mb-6 text-muted-foreground">
              Analyze some medications to see their interaction network.
            </p>
            <Link href="/app/scan">
              <Button>Scan Your First Medication</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Controls */}
            {!isFullscreen && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {graphData.nodes.length} medication
                    {graphData.nodes.length !== 1 ? 's' : ''} •{' '}
                    {graphData.links.length} connection
                    {graphData.links.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset View
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>
              </div>
            )}

            {/* Graph Container */}
            <div className={graphContainerClass}>
              {/* Fullscreen controls */}
              {isFullscreen && (
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Exit
                  </Button>
                </div>
              )}

              {/* Graph */}
              {isMobile ? (
                <InteractionGraph2D
                  graphData={graphData}
                  onNodeClick={handleNodeClick}
                  onNodeHover={handleNodeHover}
                  selectedNodeId={selectedNodeId}
                />
              ) : (
                <InteractionGraph3D
                  graphData={graphData}
                  onNodeClick={handleNodeClick}
                  onNodeHover={handleNodeHover}
                  selectedNodeId={selectedNodeId}
                />
              )}

              {/* Legend */}
              <GraphLegend />

              {/* Tooltip */}
              <InteractionTooltip node={hoveredNode} position={tooltipPosition} />

              {/* Selected node info */}
              {selectedNodeId && (
                <Card className="absolute right-4 top-4 z-10 w-72 bg-background/95 backdrop-blur">
                  <div className="p-4">
                    <h3 className="mb-2 font-semibold">
                      {graphData.nodes.find((n) => n.id === selectedNodeId)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Click again to deselect or click another medication to see
                      its connections.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={handleReset}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Instructions */}
            {!isFullscreen && (
              <div className="mt-4 rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">How to use</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • <strong>Rotate:</strong> Drag with mouse (3D) or pan with touch (2D)
                  </li>
                  <li>
                    • <strong>Zoom:</strong> Scroll wheel or pinch gesture
                  </li>
                  <li>
                    • <strong>Select:</strong> Click on a medication to highlight its connections
                  </li>
                  <li>
                    • <strong>Details:</strong> Hover over a medication for quick info
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
