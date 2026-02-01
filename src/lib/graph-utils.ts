import type { DeepDiveWithMedication, GraphNode, GraphLink, GraphData } from '@/types/graph';

/**
 * Builds graph data structure from deep-dive data
 */
export function buildGraphData(deepDives: DeepDiveWithMedication[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const interactionMap = new Map<string, Set<string>>();

  // Build nodes from medications
  deepDives.forEach((dd) => {
    const medicationName = dd.medication?.brandName || dd.medication?.name || 'Unknown';
    const interactions = (dd.interactions as string[]) || [];
    const warnings = (dd.personalizedWarnings as string[]) || [];
    const confidence = dd.confidence as { overall: string; reason: string } | null;

    nodes.push({
      id: dd.medicationId,
      name: medicationName,
      val: 20 + interactions.length * 5, // Larger size for visibility
      color: getNodeColor(confidence),
      interactions,
      confidence,
      warnings,
    });

    // Track which medications mention each other in interactions
    interactions.forEach((interaction) => {
      deepDives.forEach((otherDd) => {
        if (otherDd.medicationId !== dd.medicationId) {
          const otherName = otherDd.medication?.name || otherDd.medication?.brandName || '';
          const otherBrandName = otherDd.medication?.brandName || '';

          // Check if interaction mentions the other medication
          const interactionLower = interaction.toLowerCase();
          if (
            interactionLower.includes(otherName.toLowerCase()) ||
            (otherBrandName && interactionLower.includes(otherBrandName.toLowerCase()))
          ) {
            const key = [dd.medicationId, otherDd.medicationId].sort().join('::');
            if (!interactionMap.has(key)) {
              interactionMap.set(key, new Set());
            }
            interactionMap.get(key)!.add(interaction);
          }
        }
      });
    });
  });

  // Build links from interaction map
  interactionMap.forEach((interactions, key) => {
    const [source, target] = key.split('::');
    if (source && target) {
      links.push({
        source,
        target,
        color: getLinkColor(Array.from(interactions)),
        interactions: Array.from(interactions),
      });
    }
  });

  // If no direct interactions found, check for common drug class interactions
  if (links.length === 0 && nodes.length > 1) {
    // Create weaker connections based on common categories or warning keywords
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        // Check for common warning keywords that might indicate interaction potential
        const commonKeywords = ['blood', 'liver', 'kidney', 'heart', 'drowsiness', 'bleeding'];
        const node1Text = [...node1!.interactions, ...(node1!.warnings || [])].join(' ').toLowerCase();
        const node2Text = [...node2!.interactions, ...(node2!.warnings || [])].join(' ').toLowerCase();

        const sharedKeywords = commonKeywords.filter(
          (kw) => node1Text.includes(kw) && node2Text.includes(kw)
        );

        if (sharedKeywords.length > 0) {
          links.push({
            source: node1!.id,
            target: node2!.id,
            color: '#3b82f6', // Blue for potential/unknown interactions
            interactions: [`May share effects on: ${sharedKeywords.join(', ')}`],
          });
        }
      }
    }
  }

  // Filter out links that reference non-existent nodes
  const nodeIds = new Set(nodes.map(n => n.id));
  const validLinks = links.filter(link =>
    nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
  );

  return { nodes, links: validLinks };
}

/**
 * Determines node color based on confidence level
 */
export function getNodeColor(confidence: { overall: string } | null): string {
  if (!confidence) return '#3b82f6'; // Blue for unknown
  switch (confidence.overall) {
    case 'high':
      return '#22c55e'; // Green
    case 'medium':
      return '#eab308'; // Yellow
    case 'low':
      return '#ef4444'; // Red
    default:
      return '#3b82f6'; // Blue
  }
}

/**
 * Determines link color based on interaction severity
 */
export function getLinkColor(interactions: string[]): string {
  const text = interactions.join(' ').toLowerCase();

  // Check for dangerous keywords
  if (
    text.includes('avoid') ||
    text.includes('contraindicated') ||
    text.includes('serious') ||
    text.includes('dangerous') ||
    text.includes('do not') ||
    text.includes('never') ||
    text.includes('fatal') ||
    text.includes('life-threatening')
  ) {
    return '#ef4444'; // Red - dangerous
  }

  // Check for moderate warning keywords
  if (
    text.includes('caution') ||
    text.includes('monitor') ||
    text.includes('moderate') ||
    text.includes('may increase') ||
    text.includes('may decrease') ||
    text.includes('careful') ||
    text.includes('consult')
  ) {
    return '#eab308'; // Yellow - moderate
  }

  return '#22c55e'; // Green - generally safe
}

/**
 * Highlights connected nodes and dims others when a node is selected
 */
export function getHighlightedData(
  graphData: GraphData,
  selectedNodeId: string | null
): GraphData {
  if (!selectedNodeId) return graphData;

  const connectedIds = new Set<string>();
  connectedIds.add(selectedNodeId);

  graphData.links.forEach((link) => {
    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;

    if (sourceId === selectedNodeId || targetId === selectedNodeId) {
      connectedIds.add(sourceId);
      connectedIds.add(targetId);
    }
  });

  return {
    nodes: graphData.nodes.map((node) => ({
      ...node,
      opacity: connectedIds.has(node.id) ? 1 : 0.2,
    })),
    links: graphData.links.map((link) => {
      const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;

      return {
        ...link,
        opacity: connectedIds.has(sourceId) && connectedIds.has(targetId) ? 1 : 0.1,
      };
    }),
  };
}
