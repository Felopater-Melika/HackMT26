'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { GraphData, GraphNode } from '@/types/graph';
import { getHighlightedData } from '@/lib/graph-utils';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
  }
);

interface InteractionGraph3DProps {
  graphData: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null, position: { x: number; y: number }) => void;
  selectedNodeId?: string | null;
}

export function InteractionGraph3D({
  graphData,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
}: InteractionGraph3DProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-rotate the graph
  useEffect(() => {
    if (!fgRef.current || !isInitialized) return;

    let angle = 0;
    const distance = 300;

    const rotateInterval = setInterval(() => {
      if (!selectedNodeId) {
        angle += Math.PI / 300; // Slow rotation
        fgRef.current?.cameraPosition({
          x: distance * Math.sin(angle),
          z: distance * Math.cos(angle),
        });
      }
    }, 50);

    return () => clearInterval(rotateInterval);
  }, [isInitialized, selectedNodeId]);

  // Initialize camera position and zoom to fit
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Wait for simulation to settle, then zoom to fit
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 100);
        setIsInitialized(true);
      }, 500);
    }
  }, [graphData.nodes.length]);

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (onNodeClick) {
        onNodeClick(node as GraphNode);
      }

      // Focus on clicked node
      if (fgRef.current) {
        const distance = 150;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          {
            x: node.x * distRatio,
            y: node.y * distRatio,
            z: node.z * distRatio,
          },
          node,
          1000
        );
      }
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (onNodeHover) {
        if (node && typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number') {
          // Get screen coordinates
          try {
            const pos = fgRef.current?.graph2ScreenCoords(node.x, node.y, node.z);
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
    <ForceGraph3D
      ref={fgRef}
      graphData={displayData}
      backgroundColor="rgba(10, 10, 26, 1)"
      nodeLabel="name"
      nodeColor="color"
      nodeVal="val"
      nodeResolution={16}
      nodeRelSize={8}
      linkColor="color"
      linkWidth={3}
      linkDirectionalParticles={3}
      linkDirectionalParticleSpeed={0.008}
      linkDirectionalParticleWidth={3}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      d3AlphaDecay={0.01}
      d3VelocityDecay={0.2}
      warmupTicks={100}
      cooldownTicks={200}
      controlType="orbit"
      enableNodeDrag={true}
      enableNavigationControls={true}
    />
  );
}
