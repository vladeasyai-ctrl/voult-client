import { getToken } from './auth';
import type { Document, ImportSession } from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export type ImportEventType =
  | 'UPLOAD_RECEIVED'
  | 'STORING'
  | 'STORAGE_COMPLETE'
  | 'ANALYZING'
  | 'PROPOSAL_READY'
  | 'FAILED';

export interface ImportEvent {
  type: ImportEventType;
  session: ImportSession;
  document: Document | null;
  message: string | null;
}

function parseSseChunk(buffer: string): { events: ImportEvent[]; rest: string } {
  const events: ImportEvent[] = [];
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
      const parsed = JSON.parse(dataLine) as ImportEvent;
      events.push({
        ...parsed,
        type: (eventType ?? parsed.type) as ImportEventType,
      });
    } catch {
      // ignore malformed chunks
    }
  }

  return { events, rest };
}

export function subscribeImportEvents(
  importId: string,
  onEvent: (event: ImportEvent) => void,
  onError?: (error: Error) => void,
): () => void {
  const controller = new AbortController();

  void (async () => {
    const token = getToken();
    const response = await fetch(`${API_URL}/api/imports/${importId}/events`, {
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

export function createImportWithProgress(
  file: File,
  options: {
    spaceId?: string | null;
    parentId?: string | null;
    onProgress?: (percent: number) => void;
  } = {},
): Promise<ImportSession> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);

    const params = new URLSearchParams();
    if (options.spaceId) params.set('spaceId', options.spaceId);
    if (options.parentId) params.set('parentId', options.parentId);
    const qs = params.toString();

    xhr.open('POST', `${API_URL}/api/imports${qs ? `?${qs}` : ''}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ImportSession);
        } catch {
          reject(new Error('Invalid import response'));
        }
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; code?: string };
        reject(new Error(body.message ?? 'Upload failed'));
      } catch {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(form);
  });
}
