import type { TreeNode } from './types';

function cloneNode(node: TreeNode): TreeNode {
  return {
    ...node,
    children: node.children.map(cloneNode),
  };
}

function findParentList(
  roots: TreeNode[],
  parentId: string | null,
): TreeNode[] | null {
  if (parentId === null) return roots;
  for (const root of roots) {
    if (root.id === parentId) return root.children;
    const inChild = findParentInSubtree(root, parentId);
    if (inChild) return inChild;
  }
  return null;
}

function findParentInSubtree(node: TreeNode, parentId: string): TreeNode[] | null {
  if (node.id === parentId) return node.children;
  for (const child of node.children) {
    const found = findParentInSubtree(child, parentId);
    if (found) return found;
  }
  return null;
}

function extractNode(roots: TreeNode[], nodeId: string): TreeNode | null {
  for (let i = 0; i < roots.length; i++) {
    if (roots[i].id === nodeId) {
      return roots.splice(i, 1)[0];
    }
    const fromChild = extractNode(roots[i].children, nodeId);
    if (fromChild) return fromChild;
  }
  return null;
}

export function applyTreeMove(
  roots: TreeNode[],
  nodeId: string,
  newParentId: string | null,
  sortIndex: number,
): TreeNode[] {
  const cloned = roots.map(cloneNode);
  const node = extractNode(cloned, nodeId);
  if (!node) return roots;

  const targetList = findParentList(cloned, newParentId);
  if (!targetList) return roots;

  const index = Math.max(0, Math.min(sortIndex, targetList.length));
  node.parentId = newParentId;
  targetList.splice(index, 0, node);

  return cloned;
}
