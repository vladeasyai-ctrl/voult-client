import type { TreeNode } from './types';
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  readMindMapNodeDims,
  resolveMindMapNodeWidth,
} from './mind-map-node-theme';

/** @deprecated Use CSS `--mind-map-node-width` or `readMindMapNodeDims()`. */
export const NODE_WIDTH = DEFAULT_NODE_WIDTH;
/** @deprecated Use CSS `--mind-map-node-height` or `readMindMapNodeDims()`. */
export const NODE_HEIGHT = DEFAULT_NODE_HEIGHT;

export const HORIZONTAL_GAP = 140;
export const VERTICAL_GAP = 28;

let activeDims = { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };

function syncActiveDims() {
  activeDims = readMindMapNodeDims();
}

export interface PositionedNode {
  id: string;
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
  width: number;
}

export interface MindMapEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  childType: TreeNode['type'];
}

export interface MindMapLayout {
  nodes: PositionedNode[];
  width: number;
  height: number;
  edges: MindMapEdge[];
}

export function nodeLayoutWidth(node: TreeNode): number {
  return resolveMindMapNodeWidth(node.name, node.type === 'FOLDER');
}

export function curvedEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function subtreeHeight(node: TreeNode): number {
  if (!node.children.length) {
    return activeDims.height;
  }

  const childrenHeight = node.children.reduce((sum, child, index) => {
    const h = subtreeHeight(child);
    return sum + h + (index > 0 ? VERTICAL_GAP : 0);
  }, 0);

  return Math.max(activeDims.height, childrenHeight);
}

function layoutNode(
  node: TreeNode,
  x: number,
  yOffset: number,
  result: PositionedNode[],
): number {
  const width = nodeLayoutWidth(node);
  const totalH = subtreeHeight(node);
  const y = yOffset + totalH / 2 - activeDims.height / 2;

  result.push({ id: node.id, node, x, y, depth: 0, width });

  let childY = yOffset;
  const childX = x + width + HORIZONTAL_GAP;
  for (const child of node.children) {
    const childH = subtreeHeight(child);
    layoutNode(child, childX, childY, result);
    childY += childH + VERTICAL_GAP;
  }

  return totalH;
}

function buildEdges(nodes: PositionedNode[]): MindMapEdge[] {
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: MindMapEdge[] = [];

  for (const positioned of nodes) {
    for (const child of positioned.node.children) {
      const childPos = nodeById[child.id];
      if (!childPos) continue;

      edges.push({
        fromId: positioned.id,
        toId: child.id,
        x1: positioned.x + positioned.width,
        y1: positioned.y + activeDims.height / 2,
        x2: childPos.x,
        y2: childPos.y + activeDims.height / 2,
        childType: child.type,
      });
    }
  }

  return edges;
}

export function buildMindMapLayout(roots: TreeNode[]): MindMapLayout {
  syncActiveDims();
  if (roots.length === 0) {
    return { nodes: [], edges: [], width: 800, height: 600 };
  }

  const nodes: PositionedNode[] = [];
  let yCursor = 80;
  const rootGap = 120;
  const rootX = 80;

  for (const root of roots) {
    const h = layoutNode(root, rootX, yCursor, nodes);
    yCursor += h + rootGap;
  }

  const edges = buildEdges(nodes);
  const maxX = Math.max(...nodes.map((n) => n.x + n.width), 800);
  const maxY = Math.max(...nodes.map((n) => n.y + activeDims.height), 600);

  return { nodes, edges, width: maxX + 120, height: maxY + 120 };
}

export function sproutAnchor(x: number, y: number, width = activeDims.width) {
  return {
    stemX1: x + width,
    stemY: y + activeDims.height / 2,
    stemX2: x + width + 28,
    buttonX: x + width + 28,
    buttonY: y + activeDims.height / 2,
  };
}

/** Siblings sorted in layout order (top to bottom). */
export function orderedSiblings(
  parentId: string | null,
  positioned: PositionedNode[],
  excludeId?: string,
): PositionedNode[] {
  return positioned
    .filter((p) => p.node.parentId === parentId && p.id !== excludeId)
    .sort((a, b) => a.y - b.y);
}
