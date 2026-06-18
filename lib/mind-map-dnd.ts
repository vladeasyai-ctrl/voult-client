import type { PositionedNode } from './mind-map-layout';
import { NODE_HEIGHT, NODE_WIDTH } from './mind-map-layout';
import type { TreeNode } from './types';

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface DragDropTarget {
  parentId: string | null;
  sortIndex: number;
}

export function canvasPointFromClient(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  canvasX: number,
  canvasY: number,
  scale: number,
): CanvasPoint {
  return {
    x: (clientX - containerRect.left - canvasX) / scale,
    y: (clientY - containerRect.top - canvasY) / scale,
  };
}

export function hitNodeAtPoint(
  point: CanvasPoint,
  positioned: PositionedNode[],
  excludeId?: string,
): PositionedNode | null {
  for (const item of positioned) {
    if (excludeId && item.id === excludeId) continue;
    if (
      point.x >= item.x &&
      point.x <= item.x + NODE_WIDTH &&
      point.y >= item.y &&
      point.y <= item.y + NODE_HEIGHT
    ) {
      return item;
    }
  }
  return null;
}

export function computeSortIndexForPoint(
  pointY: number,
  parentId: string | null,
  positioned: PositionedNode[],
  draggedId: string,
): number {
  const siblings = positioned
    .filter((p) => p.node.parentId === parentId && p.id !== draggedId)
    .sort((a, b) => a.y - b.y);

  let index = 0;
  for (const sibling of siblings) {
    const midY = sibling.y + NODE_HEIGHT / 2;
    if (pointY > midY) {
      index += 1;
    }
  }
  return index;
}

export function resolveDragDropTarget(
  point: CanvasPoint,
  draggedNode: TreeNode,
  positioned: PositionedNode[],
  tree: TreeNode[],
): DragDropTarget | null {
  const hit = hitNodeAtPoint(point, positioned, draggedNode.id);

  if (hit && hit.node.type === 'FOLDER' && hit.id !== draggedNode.id) {
    const isDescendant = isNodeDescendantOf(draggedNode.id, hit.id, tree);
    if (!isDescendant) {
      return {
        parentId: hit.id,
        sortIndex: computeSortIndexForPoint(point.y, hit.id, positioned, draggedNode.id),
      };
    }
  }

  const sameParentSiblings = positioned.filter(
    (p) => p.node.parentId === draggedNode.parentId && p.id !== draggedNode.id,
  );
  if (sameParentSiblings.length === 0 && draggedNode.parentId === null) {
    return null;
  }

  return {
    parentId: draggedNode.parentId,
    sortIndex: computeSortIndexForPoint(
      point.y,
      draggedNode.parentId,
      positioned,
      draggedNode.id,
    ),
  };
}

function isNodeDescendantOf(ancestorId: string, candidateId: string, tree: TreeNode[]): boolean {
  const ancestor = findInTree(tree, ancestorId);
  if (!ancestor) return false;
  const walk = (node: TreeNode): boolean => {
    if (node.id === candidateId) return true;
    return node.children.some(walk);
  };
  return ancestor.children.some(walk);
}

function findInTree(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

export function insertionPlaceholderY(
  parentId: string | null,
  sortIndex: number,
  positioned: PositionedNode[],
  draggedId: string,
): number {
  const siblings = positioned
    .filter((p) => p.node.parentId === parentId && p.id !== draggedId)
    .sort((a, b) => a.y - b.y);

  if (siblings.length === 0) {
    const parent = positioned.find((p) => p.id === parentId);
    return parent ? parent.y + NODE_HEIGHT / 2 - SUGGESTION_SLOT_HEIGHT / 2 : 80;
  }

  if (sortIndex <= 0) {
    return siblings[0].y - SUGGESTION_SLOT_HEIGHT / 2 - 8;
  }
  if (sortIndex >= siblings.length) {
    const last = siblings[siblings.length - 1];
    return last.y + NODE_HEIGHT + 8 - SUGGESTION_SLOT_HEIGHT / 2;
  }
  const above = siblings[sortIndex - 1];
  const below = siblings[sortIndex];
  return (above.y + NODE_HEIGHT + below.y) / 2 - SUGGESTION_SLOT_HEIGHT / 2;
}

export function insertionPlaceholderX(
  parentId: string | null,
  positioned: PositionedNode[],
): number {
  const sibling = positioned.find((p) => p.node.parentId === parentId);
  if (sibling) return sibling.x;
  if (parentId) {
    const parent = positioned.find((p) => p.id === parentId);
    if (parent) return parent.x + NODE_WIDTH + 140;
  }
  return 80;
}

export const SUGGESTION_SLOT_HEIGHT = 48;
