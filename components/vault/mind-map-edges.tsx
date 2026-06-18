'use client';

import { curvedEdgePath } from '@/lib/mind-map-layout';

interface MindMapEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface MindMapEdgesProps {
  width: number;
  height: number;
  edges: MindMapEdge[];
}

export function MindMapEdges({ width, height, edges }: MindMapEdgesProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
    >
      {edges.map((edge) => (
        <path
          key={`${edge.fromId}-${edge.toId}`}
          d={curvedEdgePath(edge.x1, edge.y1, edge.x2, edge.y2)}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
