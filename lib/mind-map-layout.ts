import type { TreeNode } from './types';

export const NODE_WIDTH = 196;
export const NODE_HEIGHT = 60;
export const HORIZONTAL_GAP = 140;
export const VERTICAL_GAP = 28;

export interface PositionedNode {
  id: string;
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
}

export interface MindMapLayout {
  nodes: PositionedNode[];
  width: number;
  height: number;
  edges: Array<{
    fromId: string;
    toId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    childType: TreeNode['type'];
  }>;
}

function subtreeHeight(node: TreeNode): number {
  if (!node.children.length) {
    return NODE_HEIGHT;
  }

  const childrenHeight = node.children.reduce((sum, child, index) => {
    const h = subtreeHeight(child);
    return sum + h + (index > 0 ? VERTICAL_GAP : 0);
  }, 0);

  return Math.max(NODE_HEIGHT, childrenHeight);
}

function layoutNode(
  node: TreeNode,
  depth: number,
  yOffset: number,
  result: PositionedNode[],
): number {
  const x = depth * (NODE_WIDTH + HORIZONTAL_GAP);
  const totalH = subtreeHeight(node);
  const y = yOffset + totalH / 2 - NODE_HEIGHT / 2;

  result.push({ id: node.id, node, x, y, depth });

  let childY = yOffset;
  for (const child of node.children) {
    const childH = subtreeHeight(child);
    layoutNode(child, depth + 1, childY, result);
    childY += childH + VERTICAL_GAP;
  }

  return totalH;
}

export function buildMindMapLayout(roots: TreeNode[]): MindMapLayout {
  const nodes: PositionedNode[] = [];
  let yCursor = 80;
  const rootGap = 120;

  for (const root of roots) {
    const h = layoutNode(root, 0, yCursor, nodes);
    yCursor += h + rootGap;
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
        childType: child.type,
      });
    }
  }

  const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH), 800);
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT), 600);

  return { nodes, edges, width: maxX + 120, height: maxY + 120 };
}

export function curvedEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function sproutAnchor(x: number, y: number) {
  return {
    stemX1: x + NODE_WIDTH,
    stemY: y + NODE_HEIGHT / 2,
    stemX2: x + NODE_WIDTH + 28,
    buttonX: x + NODE_WIDTH + 28,
    buttonY: y + NODE_HEIGHT / 2,
  };
}
