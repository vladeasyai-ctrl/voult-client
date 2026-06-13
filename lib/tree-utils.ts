import type { TreeNode } from './types';

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export function getChildren(nodes: TreeNode[], folderId: string | null): TreeNode[] {
  if (folderId === null) return nodes;
  const folder = findNode(nodes, folderId);
  return folder?.children ?? [];
}

export function getBreadcrumb(nodes: TreeNode[], nodeId: string | null): TreeNode[] {
  if (!nodeId) return [];
  const flat = flattenTree(nodes);
  const path: TreeNode[] = [];
  let current = flat.find((n) => n.id === nodeId) ?? null;
  while (current) {
    path.unshift(current);
    current = current.parentId ? flat.find((n) => n.id === current!.parentId) ?? null : null;
  }
  return path;
}

export function isDescendant(nodes: TreeNode[], ancestorId: string, candidateId: string): boolean {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  const walk = (node: TreeNode): boolean => {
    if (node.id === candidateId) return true;
    return node.children.some(walk);
  };
  return ancestor.children.some(walk);
}
