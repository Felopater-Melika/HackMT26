export interface GraphNode {
  id: string;
  name: string;
  val: number; // Size of the node
  color: string;
  interactions: string[];
  confidence: { overall: string; reason: string } | null;
  warnings: string[] | null;
  opacity?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  color: string;
  interactions: string[];
  opacity?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface DeepDiveWithMedication {
  id: string;
  medicationId: string;
  summary: string | null;
  whatItTreats: unknown; // jsonb - string[]
  interactions: unknown; // jsonb - string[]
  personalizedWarnings: unknown; // jsonb - string[]
  sideEffects: unknown; // jsonb - { common: string[], serious: string[] }
  confidence: unknown; // jsonb - { overall: string, reason: string }
  createdAt: Date | null;
  medication: {
    id: string;
    name: string | null;
    brandName: string | null;
  } | null;
}
