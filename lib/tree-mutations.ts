import type { TreeNode } from './types';

function cloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((n) => ({ ...n, children: cloneTree(n.children) }));
}

export function isPendingNodeId(id: string): boolean {
  return id.startsWith('pending-');
}

export function collectPendingNodes(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      if (isPendingNodeId(node.id)) result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export function insertChild(
  nodes: TreeNode[],
  parentId: string | null,
  child: TreeNode,
): TreeNode[] {
  const cloned = cloneTree(nodes);
  if (parentId === null) {
    cloned.push(child);
    return cloned;
  }

  const insert = (list: TreeNode[]): boolean => {
    for (const node of list) {
      if (node.id === parentId) {
        node.children = [...node.children, child];
        return true;
      }
      if (insert(node.children)) return true;
    }
    return false;
  };

  insert(cloned);
  return cloned;
}

export function removeNodeFromTree(nodes: TreeNode[], nodeId: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => ({ ...n, children: removeNodeFromTree(n.children, nodeId) }));
}

export function renameNodeInTree(
  nodes: TreeNode[],
  nodeId: string,
  name: string,
): TreeNode[] {
  return nodes.map((n) => ({
    ...n,
    name: n.id === nodeId ? name : n.name,
    children: renameNodeInTree(n.children, nodeId, name),
  }));
}

export function replaceNodeIdInTree(
  nodes: TreeNode[],
  tempId: string,
  realId: string,
  patch: Partial<TreeNode>,
): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === tempId) {
      return {
        ...n,
        ...patch,
        id: realId,
        children: replaceNodeIdInTree(n.children, tempId, realId, patch),
      };
    }
    return {
      ...n,
      children: replaceNodeIdInTree(n.children, tempId, realId, patch),
    };
  });
}

export function mergePendingIntoTree(
  apiTree: TreeNode[],
  pendingNodes: TreeNode[],
): TreeNode[] {
  let merged = cloneTree(apiTree);
  for (const pending of pendingNodes) {
    merged = insertChild(merged, pending.parentId, pending);
  }
  return merged;
}

export function createPendingFolder(parentId: string | null): TreeNode {
  const now = new Date().toISOString();
  return {
    id: `pending-${crypto.randomUUID()}`,
    parentId,
    name: '',
    type: 'FOLDER',
    createdAt: now,
    updatedAt: now,
    children: [],
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Windows-style: parent name + next free digit (e.g. das → das1, das2). */
export function suggestChildFolderName(parentName: string, siblings: TreeNode[]): string {
  const base = parentName.trim();
  if (!base) return 'Папка1';

  const used = new Set<number>();
  const pattern = new RegExp(`^${escapeRegex(base)}(\\d+)$`, 'i');

  for (const child of siblings) {
    if (child.type !== 'FOLDER') continue;
    const match = child.name.match(pattern);
    if (match) {
      used.add(parseInt(match[1], 10));
    }
  }

  let n = 1;
  while (used.has(n)) n += 1;
  return `${base}${n}`;
}
