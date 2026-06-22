'use client';

import {
  curvedEdgePath,
  straightEdgePath,
  type MindMapLayoutMode,
} from '@/lib/mind-map-layout';

/**
 * Stroke color for mind-map connector lines.
 * Tweak in `app/globals.css` via `--color-mind-map-edge`.
 */
export const MIND_MAP_EDGE_STROKE = 'var(--color-mind-map-edge)';

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
  mode?: MindMapLayoutMode;
}

export function MindMapEdges({ width, height, edges, mode = 'classic' }: MindMapEdgesProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      aria-hidden
    >
      {edges.map((edge) => {
        const d =
          mode === 'radial'
            ? straightEdgePath(edge.x1, edge.y1, edge.x2, edge.y2)
            : curvedEdgePath(edge.x1, edge.y1, edge.x2, edge.y2);

        return (
          <path
            key={`${edge.fromId}-${edge.toId}`}
            d={d}
            fill="none"
            stroke={MIND_MAP_EDGE_STROKE}
            strokeWidth={mode === 'radial' ? 1.75 : 2}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
