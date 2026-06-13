export type NodeType = 'FOLDER' | 'DOCUMENT';

export interface TreeNode {
  id: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  createdAt: string;
  updatedAt: string;
  children: TreeNode[];
}

export interface Document {
  id: string;
  nodeId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  assetId: string;
  version: number;
  createdAt: string;
}

export interface Asset {
  id: string;
  storageKey: string;
  mimeType: string;
  size: number;
  checksum: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
}

export interface DownloadUrlResponse {
  url: string;
  expiresInSeconds: number;
}

export type DropTarget =
  | { kind: 'folder'; nodeId: string }
  | { kind: 'document'; documentId: string; nodeId: string }
  | { kind: 'content'; folderId: string | null };
