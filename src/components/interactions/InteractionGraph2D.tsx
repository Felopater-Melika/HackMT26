'use client';

import { useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { GraphData, GraphNode } from '@/types/graph';
import { getHighlightedData } from '@/lib/graph-utils';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
  }
);

interface InteractionGraph2DProps {
  graphData: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null, position: { x: number; y: number }) => void;
  selectedNodeId?: string | null;
}

export function InteractionGraph2D({
  graphData,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
}: InteractionGraph2DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  // Fit to view on load
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 50);
      }, 500);
    }
  }, [graphData.nodes.length]);

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (onNodeClick) {
        onNodeClick(node as GraphNode);
      }

      // Center on clicked node
      if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 500);
        fgRef.current.zoom(2, 500);
      }
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (onNodeHover) {
        if (node && typeof node.x === 'number' && typeof node.y === 'number') {
          // Get screen coordinates
          try {
            const pos = fgRef.current?.graph2ScreenCoords(node.x, node.y);
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
              onNodeHover(node as GraphNode, pos);
            }
          } catch {
            // Ignore errors during coordinate conversion
          }
        } else {
          onNodeHover(null, { x: 0, y: 0 });
        }
      }
    },
    [onNodeHover]
  );

  // Custom node rendering
  const nodeCanvasObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const opacity = node.opacity ?? 1;
      const radius = Math.sqrt(node.val) * 2.5; // Larger nodes
      const fontSize = Math.max(10, 14 / globalScale);

      // Draw node circle with glow effect
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      // Glow effect
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();

      // Label
      ctx.globalAlpha = opacity * 0.9;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';

      // Text background for readability
      const textWidth = ctx.measureText(node.name).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        node.x - textWidth / 2 - 2,
        node.y + radius + 2,
        textWidth + 4,
        fontSize + 2
      );

      ctx.fillStyle = '#fff';
      ctx.fillText(node.name, node.x, node.y + radius + fontSize / 2 + 4);

      ctx.globalAlpha = 1;
    },
    []
  );

  // Apply highlighting when a node is selected
  const displayData = selectedNodeId
    ? getHighlightedData(graphData, selectedNodeId)
    : graphData;

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No medications to display</p>
      </div>
    );
  }

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={displayData}
      backgroundColor="rgba(10, 10, 26, 1)"
      nodeCanvasObject={nodeCanvasObject}
      linkColor="color"
      linkWidth={3}
      linkDirectionalParticles={3}
      linkDirectionalParticleSpeed={0.01}
      linkDirectionalParticleWidth={4}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      d3AlphaDecay={0.01}
      d3VelocityDecay={0.2}
      warmupTicks={100}
      cooldownTicks={200}
      enableNodeDrag={true}
      enableZoomInteraction={true}
      enablePanInteraction={true}
    />
  );
}
