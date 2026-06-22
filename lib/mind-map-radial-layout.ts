import type { MindMapEdge, MindMapLayout, PositionedNode } from './mind-map-layout';
import { readMindMapNodeDims } from './mind-map-node-theme';
import type { TreeNode } from './types';

export const MAX_RADIAL_CHILDREN = 6;
export const RADIAL_FILE_RADIUS = 100;
export const RADIAL_FOLDER_RADIUS = 340;
const CANVAS_PADDING = 80;

interface LayoutCtx {
  nodes: PositionedNode[];
  edges: MindMapEdge[];
  dims: { width: number; height: number };
}

function edgePointOnRect(
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number,
) {
  const hw = w / 2;
  const hh = h / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tx = Math.abs(cos) > 1e-6 ? hw / Math.abs(cos) : Infinity;
  const ty = Math.abs(sin) > 1e-6 ? hh / Math.abs(sin) : Infinity;
  const t = Math.min(tx, ty);
  return { x: cx + cos * t, y: cy + sin * t };
}

/** Evenly spread angles; nested folders fan outward away from their parent. */
function distributeAngles(count: number, centerAngle: number | null): number[] {
  if (count === 0) return [];
  if (centerAngle === null) {
    return Array.from(
      { length: count },
      (_, i) => (2 * Math.PI * i) / count - Math.PI / 2,
    );
  }
  if (count === 1) return [centerAngle];
  const span = Math.min(Math.PI * 1.2, (Math.PI / 3) * count);
  const start = centerAngle - span / 2;
  return Array.from({ length: count }, (_, i) => start + (span * i) / (count - 1));
}

function layoutRadialNode(
  node: TreeNode,
  cx: number,
  cy: number,
  depth: number,
  outwardAngle: number | null,
  ctx: LayoutCtx,
) {
  const { width, height } = ctx.dims;
  ctx.nodes.push({
    id: node.id,
    node,
    x: cx - width / 2,
    y: cy - height / 2,
    depth,
  });

  const children = node.children.slice(0, MAX_RADIAL_CHILDREN);
  const angles = distributeAngles(children.length, outwardAngle);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const angle = angles[i];
    const radius =
      child.type === 'FOLDER' ? RADIAL_FOLDER_RADIUS : RADIAL_FILE_RADIUS;
    const childCx = cx + radius * Math.cos(angle);
    const childCy = cy + radius * Math.sin(angle);

    const from = edgePointOnRect(cx, cy, width, height, angle);
    const to = edgePointOnRect(childCx, childCy, width, height, angle + Math.PI);

    ctx.edges.push({
      fromId: node.id,
      toId: child.id,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      childType: child.type,
    });

    if (child.type === 'FOLDER') {
      layoutRadialNode(child, childCx, childCy, depth + 1, angle, ctx);
    } else {
      ctx.nodes.push({
        id: child.id,
        node: child,
        x: childCx - width / 2,
        y: childCy - height / 2,
        depth: depth + 1,
      });
    }
  }
}

function normalizeLayout(ctx: LayoutCtx): MindMapLayout {
  const { nodes, edges, dims } = ctx;
  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + dims.width);
    maxY = Math.max(maxY, n.y + dims.height);
  }

  const shiftX = CANVAS_PADDING - minX;
  const shiftY = CANVAS_PADDING - minY;

  for (const n of nodes) {
    n.x += shiftX;
    n.y += shiftY;
  }
  for (const e of edges) {
    e.x1 += shiftX;
    e.y1 += shiftY;
    e.x2 += shiftX;
    e.y2 += shiftY;
  }

  return {
    nodes,
    edges,
    width: Math.max(maxX + shiftX + CANVAS_PADDING, 800),
    height: Math.max(maxY + shiftY + CANVAS_PADDING, 600),
  };
}

export function buildRadialMindMapLayout(roots: TreeNode[]): MindMapLayout {
  const dims = readMindMapNodeDims();
  if (roots.length === 0) {
    return { nodes: [], edges: [], width: 800, height: 600 };
  }

  const ctx: LayoutCtx = { nodes: [], edges: [], dims };
  const startCx = 500;
  let yCursor = 500;
  const rootGap = 700;

  for (const root of roots) {
    layoutRadialNode(root, startCx, yCursor, 0, null, ctx);
    yCursor += rootGap;
  }

  return normalizeLayout(ctx);
}

export function radialEdgePath(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}
