import { clearToken, getToken } from './auth';
import { t } from './i18n';
import type {
  AiExecuteResponse,
  AiPlanAction,
  AiPlanResponse,
  Asset,
  AuthResponse,
  ConfirmImportPayload,
  Document,
  DownloadUrlResponse,
  ImportSession,
  Space,
  TreeNode,
} from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isAuthEndpoint = path.startsWith('/api/auth/');
  const token = isAuthEndpoint ? null : getToken();
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) clearToken();
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.message ?? t('errors.requestFailed'), response.status, body.code);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  loginWithGoogle: (idToken: string) =>
    request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  getSpaces: () => request<Space[]>('/api/spaces'),

  getSpace: (id: string) => request<Space>(`/api/spaces/${id}`),

  getSpaceTree: (spaceId: string) => request<TreeNode[]>(`/api/spaces/${spaceId}/tree`),

  createSpace: (name: string, presetId?: string | null) =>
    request<Space>('/api/spaces', {
      method: 'POST',
      body: JSON.stringify({ name, presetId: presetId ?? null }),
    }),

  updateSpace: (id: string, name: string, presetId?: string | null) =>
    request<Space>(`/api/spaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, presetId: presetId ?? null }),
    }),

  deleteSpace: (id: string) => request(`/api/spaces/${id}`, { method: 'DELETE' }),

  createFolder: (name: string, spaceId: string, parentId: string | null) =>
    request<{
      id: string;
      spaceId: string;
      name: string;
      parentId: string | null;
      type: string;
    }>('/api/nodes', {
      method: 'POST',
      body: JSON.stringify({ name, spaceId, parentId, type: 'FOLDER' }),
    }),

  renameNode: (id: string, name: string) =>
    request(`/api/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  moveNode: (id: string, parentId: string | null) =>
    request(`/api/nodes/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId }),
    }),

  deleteFolder: (id: string) =>
    request(`/api/nodes/${id}`, { method: 'DELETE' }),

  getDocuments: () => request<Document[]>('/api/documents/search'),

  searchDocuments: (q: string) =>
    request<Document[]>(`/api/documents/search?q=${encodeURIComponent(q)}`),

  getDocument: (id: string) => request<Document>(`/api/documents/${id}`),

  getDocumentByNode: (nodeId: string) =>
    request<Document>(`/api/documents/by-node/${nodeId}`),

  createDocument: (
    title: string,
    parentId: string | null,
    assetId: string,
    description?: string,
  ) =>
    request<Document>('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title, parentId, assetId, description }),
    }),

  deleteDocument: (id: string) =>
    request(`/api/documents/${id}`, { method: 'DELETE' }),

  uploadAsset: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<Asset>('/api/assets/upload', { method: 'POST', body: form });
  },

  getDownloadUrl: (assetId: string) =>
    request<DownloadUrlResponse>(`/api/assets/${assetId}/download`),

  getAsset: (assetId: string) => request<Asset>(`/api/assets/${assetId}`),

  createImport: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ImportSession>('/api/imports', { method: 'POST', body: form });
  },

  getImport: (id: string) => request<ImportSession>(`/api/imports/${id}`),

  analyzeImport: (id: string) =>
    request<ImportSession>(`/api/imports/${id}/analyze`, { method: 'POST' }),

  confirmImport: (id: string, payload: ConfirmImportPayload) =>
    request<Document>(`/api/imports/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  discardImport: (id: string) =>
    request(`/api/imports/${id}/discard`, { method: 'POST' }),

  planAiCommand: (message: string) =>
    request<AiPlanResponse>('/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  executeAiPlan: (actions: AiPlanAction[]) =>
    request<AiExecuteResponse>('/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({ actions }),
    }),
};

