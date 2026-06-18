import type { TreeNode } from './types';

export type NodeOrderMap = Record<string, string[]>;

export const ROOT_ORDER_KEY = '__roots__';

export function parentOrderKey(parentId: string | null): string {
  return parentId ?? ROOT_ORDER_KEY;
}

function sortByOrder(nodes: TreeNode[], order: string[] | undefined): TreeNode[] {
  if (!order?.length) {
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const result: TreeNode[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const node = byId[id];
    if (node) {
      result.push(node);
      seen.add(id);
    }
  }

  for (const node of nodes) {
    if (!seen.has(node.id)) {
      result.push(node);
    }
  }

  return result;
}

function applyOrderLevel(
  nodes: TreeNode[],
  parentId: string | null,
  orderMap: NodeOrderMap,
): TreeNode[] {
  const sorted = sortByOrder(nodes, orderMap[parentOrderKey(parentId)]);
  return sorted.map((node) => ({
    ...node,
    children: applyOrderLevel(node.children, node.id, orderMap),
  }));
}

export function applyNodeOrder(nodes: TreeNode[], orderMap: NodeOrderMap): TreeNode[] {
  return applyOrderLevel(nodes, null, orderMap);
}

function syncLevel(
  nodes: TreeNode[],
  parentId: string | null,
  orderMap: NodeOrderMap,
): NodeOrderMap {
  const key = parentOrderKey(parentId);
  const ids = nodes.map((n) => n.id);
  const existing = orderMap[key] ?? [];
  const kept = existing.filter((id) => ids.includes(id));
  const missing = ids.filter((id) => !kept.includes(id));
  const next = { ...orderMap, [key]: [...kept, ...missing] };

  for (const node of nodes) {
    Object.assign(next, syncLevel(node.children, node.id, next));
  }

  return next;
}

export function syncOrderMap(tree: TreeNode[], orderMap: NodeOrderMap): NodeOrderMap {
  return syncLevel(tree, null, orderMap);
}

export function reorderInMap(
  orderMap: NodeOrderMap,
  parentId: string | null,
  nodeId: string,
  sortIndex: number,
): NodeOrderMap {
  const key = parentOrderKey(parentId);
  const list = [...(orderMap[key] ?? [])];
  const from = list.indexOf(nodeId);
  if (from === -1) return orderMap;

  list.splice(from, 1);
  const index = Math.max(0, Math.min(sortIndex, list.length));
  list.splice(index, 0, nodeId);

  return { ...orderMap, [key]: list };
}

export function moveInOrderMap(
  orderMap: NodeOrderMap,
  nodeId: string,
  fromParentId: string | null,
  toParentId: string | null,
  sortIndex: number,
): NodeOrderMap {
  const fromKey = parentOrderKey(fromParentId);
  const toKey = parentOrderKey(toParentId);

  if (fromKey === toKey) {
    return reorderInMap(orderMap, fromParentId, nodeId, sortIndex);
  }

  const fromList = [...(orderMap[fromKey] ?? [])];
  const fromIdx = fromList.indexOf(nodeId);
  if (fromIdx !== -1) {
    fromList.splice(fromIdx, 1);
  }

  const toList = [...(orderMap[toKey] ?? [])];
  const index = Math.max(0, Math.min(sortIndex, toList.length));
  toList.splice(index, 0, nodeId);

  return {
    ...orderMap,
    [fromKey]: fromList,
    [toKey]: toList,
  };
}

export function removeFromOrderMap(orderMap: NodeOrderMap, nodeId: string): NodeOrderMap {
  const next: NodeOrderMap = {};
  for (const [key, list] of Object.entries(orderMap)) {
    next[key] = list.filter((id) => id !== nodeId);
  }
  return next;
}

export function orderMapsEqual(a: NodeOrderMap, b: NodeOrderMap): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const listA = a[key] ?? [];
    const listB = b[key] ?? [];
    if (listA.length !== listB.length) return false;
    for (let i = 0; i < listA.length; i++) {
      if (listA[i] !== listB[i]) return false;
    }
  }
  return true;
}
