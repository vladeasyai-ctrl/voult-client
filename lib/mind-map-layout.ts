import type { MindMapSuggestion } from './presets';
import type { TreeNode } from './types';

export const NODE_WIDTH = 196;
export const NODE_HEIGHT = 60;
export const HORIZONTAL_GAP = 140;
export const VERTICAL_GAP = 28;
export const SUGGESTION_HEIGHT = 48;

export interface PositionedNode {
  id: string;
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
}

export interface PositionedSuggestion {
  suggestion: MindMapSuggestion;
  x: number;
  y: number;
  parentId: string;
}

export interface MindMapLayout {
  nodes: PositionedNode[];
  suggestions: PositionedSuggestion[];
  width: number;
  height: number;
  edges: Array<{ fromId: string; toId: string; x1: number; y1: number; x2: number; y2: number }>;
}

function subtreeHeight(
  node: TreeNode,
  suggestions: MindMapSuggestion[],
): number {
  const suggestionCount = suggestions.filter((s) => s.parentId === node.id).length;
  const suggestionBlock =
    suggestionCount > 0
      ? suggestionCount * (SUGGESTION_HEIGHT + 12) + 8
      : 0;

  if (!node.children.length && suggestionCount === 0) {
    return NODE_HEIGHT;
  }

  const childrenHeight = node.children.reduce((sum, child, index) => {
    const childSuggestions = suggestions.filter((s) => s.parentId === child.id);
    const h = subtreeHeight(child, suggestions);
    return sum + h + (index > 0 ? VERTICAL_GAP : 0);
  }, 0);

  return Math.max(NODE_HEIGHT, childrenHeight + suggestionBlock);
}

function layoutNode(
  node: TreeNode,
  depth: number,
  yOffset: number,
  suggestions: MindMapSuggestion[],
  result: PositionedNode[],
): number {
  const x = depth * (NODE_WIDTH + HORIZONTAL_GAP);
  const nodeSuggestions = suggestions.filter((s) => s.parentId === node.id);
  const totalH = subtreeHeight(node, suggestions);
  const y = yOffset + totalH / 2 - NODE_HEIGHT / 2;

  result.push({ id: node.id, node, x, y, depth });

  let childY = yOffset;
  for (const child of node.children) {
    const childH = subtreeHeight(child, suggestions);
    layoutNode(child, depth + 1, childY, suggestions, result);
    childY += childH + VERTICAL_GAP;
  }

  return totalH;
}

export function buildMindMapLayout(
  roots: TreeNode[],
  allSuggestions: MindMapSuggestion[],
): MindMapLayout {
  const nodes: PositionedNode[] = [];
  let yCursor = 80;
  const rootGap = 120;

  for (const root of roots) {
    const h = layoutNode(root, 0, yCursor, allSuggestions, nodes);
    yCursor += h + rootGap;
  }

  const suggestions: PositionedSuggestion[] = [];
  for (const positioned of nodes) {
    const nodeSuggestions = allSuggestions.filter(
      (s) => s.parentId === positioned.node.id,
    );
    const startY =
      positioned.y +
      NODE_HEIGHT / 2 -
      ((nodeSuggestions.length - 1) * (SUGGESTION_HEIGHT + 12)) / 2;

    nodeSuggestions.forEach((suggestion, index) => {
      suggestions.push({
        suggestion,
        parentId: positioned.node.id,
        x: positioned.x + NODE_WIDTH + HORIZONTAL_GAP * 0.55,
        y: startY + index * (SUGGESTION_HEIGHT + 12),
      });
    });
  }

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: MindMapLayout['edges'] = [];

  for (const positioned of nodes) {
    for (const child of positioned.node.children) {
      const childPos = nodeById[child.id];
      if (!childPos) continue;
      edges.push({
        fromId: positioned.id,
        toId: child.id,
        x1: positioned.x + NODE_WIDTH,
        y1: positioned.y + NODE_HEIGHT / 2,
        x2: childPos.x,
        y2: childPos.y + NODE_HEIGHT / 2,
      });
    }

    const nodeSuggestions = suggestions.filter((s) => s.parentId === positioned.id);
    for (const s of nodeSuggestions) {
      edges.push({
        fromId: positioned.id,
        toId: s.suggestion.key,
        x1: positioned.x + NODE_WIDTH,
        y1: positioned.y + NODE_HEIGHT / 2,
        x2: s.x,
        y2: s.y + SUGGESTION_HEIGHT / 2,
      });
    }
  }

  const maxX = Math.max(
    ...nodes.map((n) => n.x + NODE_WIDTH),
    ...suggestions.map((s) => s.x + NODE_WIDTH),
    800,
  );
  const maxY = Math.max(
    ...nodes.map((n) => n.y + NODE_HEIGHT),
    ...suggestions.map((s) => s.y + SUGGESTION_HEIGHT),
    600,
  );

  return { nodes, suggestions, edges, width: maxX + 120, height: maxY + 120 };
}

export function curvedEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}
