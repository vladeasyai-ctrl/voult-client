import type { TreeNode } from './types';

export const NODE_WIDTH = 196;
export const NODE_HEIGHT = 60;
export const HORIZONTAL_GAP = 140;
export const VERTICAL_GAP = 28;

/** Gap between edge segment and node border (radial mode). */
export const EDGE_NODE_GAP = 14;

/** Short fixed ray length for document nodes. */
export const DOCUMENT_RADIAL_DISTANCE =
  NODE_WIDTH * 0.45 + HORIZONTAL_GAP * 0.25;

/** Padding between sibling subtrees in radial mode. */
export const RADIAL_SIBLING_GAP = 28;

/** Padding between parent node and child subtree along a ray. */
export const RADIAL_NODE_GAP = 22;

/** Full arc span for fanning children (radians). Grows slightly with child count. */
export const RADIAL_ARC_BASE = Math.PI * 0.72;

/** @deprecated Use per-child distances from layout; kept for classic fallback. */
export const RADIAL_CHILD_DISTANCE = HORIZONTAL_GAP + NODE_WIDTH * 0.35;

export type MindMapLayoutMode = 'classic' | 'radial';

export interface RadialLayoutConfig {
  /**
   * Folder ray length in px. Clamped to [minFolderRayLength, 2 * minFolderRayLength].
   * When omitted, uses the computed minimum for the current tree.
   */
  folderRayLength?: number | null;
}

export interface RadialSubtreeMetrics {
  reach: number;
  width: number;
  height: number;
}

export interface PositionedNode {
  id: string;
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
  /** Child index angle in radial mode (for DnD ordering). */
  siblingAngle?: number;
  /** Distance from parent center used when placing this node (radial mode). */
  parentDistance?: number;
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
  mode: MindMapLayoutMode;
  /** Minimum folder ray length for the current tree (radial mode). */
  minFolderRayLength?: number;
  /** Active folder ray length after clamping (radial mode). */
  folderRayLength?: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RadialLayoutPlan {
  metricsById: Map<string, RadialSubtreeMetrics>;
  distanceById: Map<string, number>;
  minFolderRayLength: number;
  folderRayLength: number;
}

function nodeHalfExtents() {
  return { hw: NODE_WIDTH / 2, hh: NODE_HEIGHT / 2 };
}

/** Distance from rectangle center to edge along `angle`. */
export function rectSupport(angle: number, hw: number, hh: number): number {
  return Math.abs(hw * Math.cos(angle)) + Math.abs(hh * Math.sin(angle));
}

function selfReach(): number {
  const { hw, hh } = nodeHalfExtents();
  return Math.hypot(hw, hh);
}

function rectCenter(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Point on rect border facing `toward`, offset outward by `gap`. */
export function borderPoint(
  rect: Rect,
  towardX: number,
  towardY: number,
  gap: number,
): { x: number; y: number } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const angle = Math.atan2(towardY - cy, towardX - cx);
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const absTan = Math.abs(Math.tan(angle));

  let dx: number;
  let dy: number;
  if (absTan * hw <= hh) {
    dx = Math.sign(Math.cos(angle)) * hw;
    dy = dx * Math.tan(angle);
  } else {
    dy = Math.sign(Math.sin(angle)) * hh;
    dx = dy / Math.tan(angle);
  }

  return {
    x: cx + dx + Math.cos(angle) * gap,
    y: cy + dy + Math.sin(angle) * gap,
  };
}

export function computeStraightEdgeEndpoints(
  parent: Pick<PositionedNode, 'x' | 'y'>,
  child: Pick<PositionedNode, 'x' | 'y'>,
  gap = EDGE_NODE_GAP,
): { x1: number; y1: number; x2: number; y2: number } {
  const parentRect: Rect = { x: parent.x, y: parent.y, width: NODE_WIDTH, height: NODE_HEIGHT };
  const childRect: Rect = { x: child.x, y: child.y, width: NODE_WIDTH, height: NODE_HEIGHT };
  const pc = rectCenter(parentRect);
  const cc = rectCenter(childRect);
  const start = borderPoint(parentRect, cc.x, cc.y, gap);
  const end = borderPoint(childRect, pc.x, pc.y, gap);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function straightEdgePath(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function curvedEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function radialArcSpan(childCount: number): number {
  if (childCount <= 1) return 0;
  const minStep = 0.38;
  return Math.min(Math.PI * 1.15, Math.max(RADIAL_ARC_BASE, (childCount - 1) * minStep));
}

export function radialChildAngles(childCount: number): number[] {
  if (childCount === 0) return [];
  if (childCount === 1) return [0];
  const span = radialArcSpan(childCount);
  const start = -span / 2;
  const step = span / (childCount - 1);
  return Array.from({ length: childCount }, (_, i) => start + i * step);
}

/** Minimum center distance so parent node and child subtree do not overlap along `angle`. */
export function minRadialDistanceForChild(
  childMetrics: RadialSubtreeMetrics,
  angle: number,
  childType: TreeNode['type'],
): number {
  const { hw, hh } = nodeHalfExtents();

  if (childType === 'DOCUMENT') {
    const parentSupport = rectSupport(angle, hw, hh);
    const childSupport = rectSupport(angle + Math.PI, hw, hh);
    return parentSupport + childSupport + RADIAL_NODE_GAP;
  }

  const parentSupport = rectSupport(angle, hw, hh);
  return parentSupport + childMetrics.reach + RADIAL_NODE_GAP;
}

function resolveSiblingDistances(
  angles: number[],
  distances: number[],
  metrics: RadialSubtreeMetrics[],
) {
  const count = angles.length;
  for (let pass = 0; pass < count * 3; pass++) {
    let changed = false;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const xi = distances[i] * Math.cos(angles[i]);
        const yi = distances[i] * Math.sin(angles[i]);
        const xj = distances[j] * Math.cos(angles[j]);
        const yj = distances[j] * Math.sin(angles[j]);
        const dx = xj - xi;
        const dy = yj - yi;
        const centerDist = Math.hypot(dx, dy);
        const minDist = metrics[i].reach + metrics[j].reach + RADIAL_SIBLING_GAP;

        if (centerDist >= minDist) continue;

        const push = centerDist > 0.001
          ? (minDist - centerDist) / 2 + 2
          : minDist / 2 + 2;

        distances[i] += push;
        distances[j] += push;
        changed = true;
      }
    }

    if (!changed) break;
  }
}


function planMinFolderDistances(node: TreeNode): {
  distances: Map<string, number>;
  minFolderRayLength: number;
} {
  const distances = new Map<string, number>();
  let minFolderRayLength = DOCUMENT_RADIAL_DISTANCE;

  const walk = (current: TreeNode): RadialSubtreeMetrics => {
    if (!current.children.length) {
      return { reach: selfReach(), width: NODE_WIDTH, height: NODE_HEIGHT };
    }

    const angles = radialChildAngles(current.children.length);
    const childMetrics = current.children.map((child) => walk(child));
    const localDistances: number[] = [];

    for (let i = 0; i < current.children.length; i++) {
      const child = current.children[i];
      let distance: number;

      if (child.type === 'DOCUMENT') {
        distance = minRadialDistanceForChild(childMetrics[i], angles[i], 'DOCUMENT');
      } else {
        distance = minRadialDistanceForChild(childMetrics[i], angles[i], 'FOLDER');
        minFolderRayLength = Math.max(minFolderRayLength, distance);
      }

      localDistances.push(distance);
    }

    resolveSiblingDistances(angles, localDistances, childMetrics);

    for (let i = 0; i < current.children.length; i++) {
      const child = current.children[i];
      const distance = localDistances[i];
      distances.set(child.id, distance);
      if (child.type === 'FOLDER') {
        minFolderRayLength = Math.max(minFolderRayLength, distance);
      }
    }

    const { hw, hh } = nodeHalfExtents();
    let minX = -hw;
    let maxX = hw;
    let minY = -hh;
    let maxY = hh;

    for (let i = 0; i < current.children.length; i++) {
      const distance = localDistances[i];
      const cx = distance * Math.cos(angles[i]);
      const cy = distance * Math.sin(angles[i]);
      const cm = childMetrics[i];
      minX = Math.min(minX, cx - cm.width / 2);
      maxX = Math.max(maxX, cx + cm.width / 2);
      minY = Math.min(minY, cy - cm.height / 2);
      maxY = Math.max(maxY, cy + cm.height / 2);
    }

    const corners: Array<[number, number]> = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ];

    return {
      reach: Math.max(selfReach(), ...corners.map(([x, y]) => Math.hypot(x, y))),
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  walk(node);

  return {
    distances,
    minFolderRayLength: Math.max(minFolderRayLength, DOCUMENT_RADIAL_DISTANCE + 1),
  };
}

function computeNodeMetrics(
  node: TreeNode,
  distances: Map<string, number>,
): RadialSubtreeMetrics {
  const { hw, hh } = nodeHalfExtents();
  let minX = -hw;
  let maxX = hw;
  let minY = -hh;
  let maxY = hh;

  const angles = radialChildAngles(node.children.length);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const distance = distances.get(child.id) ?? DOCUMENT_RADIAL_DISTANCE;
    const childMetrics = computeNodeMetrics(child, distances);
    const cx = distance * Math.cos(angles[i]);
    const cy = distance * Math.sin(angles[i]);
    minX = Math.min(minX, cx - childMetrics.width / 2);
    maxX = Math.max(maxX, cx + childMetrics.width / 2);
    minY = Math.min(minY, cy - childMetrics.height / 2);
    maxY = Math.max(maxY, cy + childMetrics.height / 2);
  }

  const corners: Array<[number, number]> = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];

  return {
    reach: Math.max(selfReach(), ...corners.map(([x, y]) => Math.hypot(x, y))),
    width: maxX - minX,
    height: maxY - minY,
  };
}

function refineParentDistances(node: TreeNode, distances: Map<string, number>) {
  for (const child of node.children) {
    refineParentDistances(child, distances);
  }

  if (node.children.length < 2) return;

  const angles = radialChildAngles(node.children.length);
  const localDistances = node.children.map(
    (child) => distances.get(child.id) ?? DOCUMENT_RADIAL_DISTANCE,
  );
  const childMetrics = node.children.map((child) => computeNodeMetrics(child, distances));
  resolveSiblingDistances(angles, localDistances, childMetrics);
  node.children.forEach((child, index) => {
    distances.set(child.id, localDistances[index]);
  });
}

/** Minimum folder ray length X so nested radial subtrees do not overlap. */
export function computeMinFolderRayLength(roots: TreeNode[]): number {
  if (roots.length === 0) return DOCUMENT_RADIAL_DISTANCE + 40;

  let maxMin = DOCUMENT_RADIAL_DISTANCE + 40;
  for (const root of roots) {
    const { minFolderRayLength } = planMinFolderDistances(root);
    maxMin = Math.max(maxMin, minFolderRayLength);
  }
  return Math.ceil(maxMin);
}

export function clampFolderRayLength(
  value: number | null | undefined,
  minFolderRayLength: number,
): number {
  const min = minFolderRayLength;
  const max = min * 2;
  const resolved = value == null ? min : value;
  return Math.min(max, Math.max(min, resolved));
}

function buildRadialLayoutPlan(
  roots: TreeNode[],
  config: RadialLayoutConfig,
): RadialLayoutPlan {
  const minFolderRayLength = computeMinFolderRayLength(roots);
  const folderRayLength = clampFolderRayLength(config.folderRayLength, minFolderRayLength);
  const rayScale = folderRayLength / minFolderRayLength;

  const distances = new Map<string, number>();

  for (const root of roots) {
    const base = planMinFolderDistances(root);
    for (const [id, distance] of base.distances) {
      const node = findNodeInRoots(roots, id);
      if (!node) continue;
      distances.set(id, node.type === 'FOLDER' ? distance * rayScale : distance);
    }
  }

  for (const root of roots) {
    refineParentDistances(root, distances);
  }

  const metricsById = new Map<string, RadialSubtreeMetrics>();
  for (const root of roots) {
    metricsById.set(root.id, computeNodeMetrics(root, distances));
    collectStoredMetrics(root, distances, metricsById);
  }

  return {
    metricsById,
    distanceById: distances,
    minFolderRayLength,
    folderRayLength,
  };
}

function findNodeInRoots(roots: TreeNode[], id: string): TreeNode | null {
  for (const root of roots) {
    const found = findNode(root, id);
    if (found) return found;
  }
  return null;
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function collectStoredMetrics(
  node: TreeNode,
  distances: Map<string, number>,
  metricsById: Map<string, RadialSubtreeMetrics>,
) {
  for (const child of node.children) {
    metricsById.set(child.id, computeNodeMetrics(child, distances));
    collectStoredMetrics(child, distances, metricsById);
  }
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

function layoutClassicNode(
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
    layoutClassicNode(child, depth + 1, childY, result);
    childY += childH + VERTICAL_GAP;
  }

  return totalH;
}

function layoutRadialNode(
  node: TreeNode,
  depth: number,
  centerX: number,
  centerY: number,
  plan: RadialLayoutPlan,
  result: PositionedNode[],
  siblingAngle?: number,
  parentDistance?: number,
) {
  const x = centerX - NODE_WIDTH / 2;
  const y = centerY - NODE_HEIGHT / 2;
  result.push({
    id: node.id,
    node,
    x,
    y,
    depth,
    siblingAngle,
    parentDistance,
  });

  const angles = radialChildAngles(node.children.length);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const angle = angles[i];
    const distance = plan.distanceById.get(child.id) ?? DOCUMENT_RADIAL_DISTANCE;
    const childCenterX = centerX + distance * Math.cos(angle);
    const childCenterY = centerY + distance * Math.sin(angle);
    layoutRadialNode(
      child,
      depth + 1,
      childCenterX,
      childCenterY,
      plan,
      result,
      angle,
      distance,
    );
  }
}

function radialRootExtents(node: TreeNode, plan: RadialLayoutPlan): RadialSubtreeMetrics {
  return plan.metricsById.get(node.id) ?? { reach: selfReach(), width: NODE_WIDTH, height: NODE_HEIGHT };
}

function buildEdges(
  nodes: PositionedNode[],
  mode: MindMapLayoutMode,
): MindMapEdge[] {
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: MindMapEdge[] = [];

  for (const positioned of nodes) {
    for (const child of positioned.node.children) {
      const childPos = nodeById[child.id];
      if (!childPos) continue;

      if (mode === 'radial') {
        const { x1, y1, x2, y2 } = computeStraightEdgeEndpoints(positioned, childPos);
        edges.push({
          fromId: positioned.id,
          toId: child.id,
          x1,
          y1,
          x2,
          y2,
          childType: child.type,
        });
      } else {
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
  }

  return edges;
}

function buildClassicLayout(roots: TreeNode[]): MindMapLayout {
  const nodes: PositionedNode[] = [];
  let yCursor = 80;
  const rootGap = 120;

  for (const root of roots) {
    const h = layoutClassicNode(root, 0, yCursor, nodes);
    yCursor += h + rootGap;
  }

  const edges = buildEdges(nodes, 'classic');
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH), 800);
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT), 600);

  return { nodes, edges, width: maxX + 120, height: maxY + 120, mode: 'classic' };
}

function buildRadialLayout(roots: TreeNode[], config: RadialLayoutConfig): MindMapLayout {
  const plan = buildRadialLayoutPlan(roots, config);
  const nodes: PositionedNode[] = [];
  let yCursor = 80;
  const rootGap = 120;
  const rootStartX = 80 + NODE_WIDTH / 2;

  for (const root of roots) {
    const extents = radialRootExtents(root, plan);
    const centerY = yCursor + extents.height / 2;
    layoutRadialNode(root, 0, rootStartX, centerY, plan, nodes);
    yCursor += extents.height + rootGap;
  }

  const edges = buildEdges(nodes, 'radial');
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH), 800);
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT), 600);

  return {
    nodes,
    edges,
    width: maxX + 120,
    height: maxY + 120,
    mode: 'radial',
    minFolderRayLength: plan.minFolderRayLength,
    folderRayLength: plan.folderRayLength,
  };
}

export function buildMindMapLayout(
  roots: TreeNode[],
  mode: MindMapLayoutMode = 'classic',
  radialConfig: RadialLayoutConfig = {},
): MindMapLayout {
  if (roots.length === 0) {
    return { nodes: [], edges: [], width: 800, height: 600, mode };
  }
  return mode === 'radial' ? buildRadialLayout(roots, radialConfig) : buildClassicLayout(roots);
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

/** Siblings sorted in layout order (Y for classic, angle for radial). */
export function orderedSiblings(
  parentId: string | null,
  positioned: PositionedNode[],
  excludeId?: string,
  mode: MindMapLayoutMode = 'classic',
): PositionedNode[] {
  const siblings = positioned.filter(
    (p) => p.node.parentId === parentId && p.id !== excludeId,
  );
  if (mode === 'radial') {
    return siblings.sort((a, b) => (a.siblingAngle ?? 0) - (b.siblingAngle ?? 0));
  }
  return siblings.sort((a, b) => a.y - b.y);
}

/** Average folder ray distance among parent's children (radial DnD helper). */
export function averageChildDistance(
  parentId: string | null,
  positioned: PositionedNode[],
): number {
  const children = positioned.filter((p) => p.node.parentId === parentId);
  if (children.length === 0) return DOCUMENT_RADIAL_DISTANCE;
  const sum = children.reduce((acc, child) => acc + (child.parentDistance ?? DOCUMENT_RADIAL_DISTANCE), 0);
  return sum / children.length;
}
