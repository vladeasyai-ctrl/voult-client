import { getToken } from './auth';
import type { Document, RemoteUploadMode, RemoteUploadSession } from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export type RemoteUploadEventType = 'FILE_UPLOADED' | 'IMPORT_CREATED' | 'SESSION_CLOSED';

export interface RemoteUploadEvent {
  type: RemoteUploadEventType;
  session: RemoteUploadSession;
  document: Document | null;
  importId: string | null;
  message: string | null;
}

export interface RemoteUploadPublicSession {
  mode: RemoteUploadMode;
  status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
  expiresAt: string;
  valid: boolean;
}

export interface RemoteUploadTokenResult {
  document: Document | null;
  importId: string | null;
}

function parseSseChunk(buffer: string): { events: RemoteUploadEvent[]; rest: string } {
  const events: RemoteUploadEvent[] = [];
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';

  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventType: string | null = null;
    let dataLine: string | null = null;
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLine = line.slice(5).trim();
      }
    }
    if (!dataLine) continue;
    try {
      const parsed = JSON.parse(dataLine) as RemoteUploadEvent;
      events.push({
        ...parsed,
        type: (eventType ?? parsed.type) as RemoteUploadEventType,
      });
    } catch {
      // ignore malformed chunks
    }
  }

  return { events, rest };
}

export function subscribeRemoteUploadEvents(
  sessionId: string,
  onEvent: (event: RemoteUploadEvent) => void,
  onError?: (error: Error) => void,
): () => void {
  const controller = new AbortController();

  void (async () => {
    const token = getToken();
    const response = await fetch(`${API_URL}/api/remote-upload-sessions/${sessionId}/events`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`SSE connection failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseChunk(buffer);
      buffer = parsed.rest;
      for (const event of parsed.events) {
        onEvent(event);
      }
    }
  })().catch((error: unknown) => {
    if (controller.signal.aborted) return;
    onError?.(error instanceof Error ? error : new Error('SSE stream failed'));
  });

  return () => controller.abort();
}

export function getRemoteUploadPublicSession(token: string): Promise<RemoteUploadPublicSession> {
  return fetch(`${API_URL}/api/remote-upload-sessions/token/${encodeURIComponent(token)}`)
    .then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Session not found');
      }
      return response.json() as Promise<RemoteUploadPublicSession>;
    });
}

export function uploadViaRemoteToken(
  token: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<RemoteUploadTokenResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);

    xhr.open(
      'POST',
      `${API_URL}/api/remote-upload-sessions/token/${encodeURIComponent(token)}/upload`,
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as RemoteUploadTokenResult);
        } catch {
          reject(new Error('Invalid upload response'));
        }
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string };
        reject(new Error(body.message ?? 'Upload failed'));
      } catch {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(form);
  });
}

export function buildRemoteUploadPageUrl(token: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');
  const url = new URL('/m/upload', origin);
  url.searchParams.set('token', token);
  return url.toString();
}

export { isAiEnrichmentPending } from '@/lib/ai-enrichment';