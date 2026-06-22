export type NodeType = 'FOLDER' | 'DOCUMENT';

export interface Space {
  id: string;
  name: string;
  presetId: string | null;
  sortOrder: number;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TreeNode {
  id: string;
  spaceId: string;
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
  assetId: string;
  title: string;
  description: string | null;
  aiSummary: string | null;
  mimeType: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ImportStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'PROPOSAL_READY'
  | 'FAILED'
  | 'CONFIRMED'
  | 'DISCARDED';

export interface ImportProposal {
  title: string;
  summary: string;
  tags: string[];
  folderPath: string[];
  createMissingFolders: boolean;
  confidence: number;
}

export interface ImportSession {
  id: string;
  assetId: string;
  status: ImportStatus;
  proposal: ImportProposal | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
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
  | { kind: 'content'; folderId: string | null };

export interface ConfirmImportPayload {
  title: string;
  summary: string;
  tags: string[];
  folderPath: string[];
  parentId: string | null;
}

export interface AiPlanAction {
  type: string;
  name?: string | null;
  newName?: string | null;
  nodeId?: string | null;
  documentId?: string | null;
  parentNodeId?: string | null;
  targetParentNodeId?: string | null;
  folderPath?: string[] | null;
  targetFolderPath?: string[] | null;
}

export interface AiPlanResponse {
  reply: string;
  actions: AiPlanAction[];
}

export interface AiExecuteResponse {
  reply: string;
  executedActions: string[];
  errors: string[];
  success: boolean;
}
