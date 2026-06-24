import type { AiStatus } from '@/lib/types';

export function isAiEnrichmentPending(aiStatus: AiStatus | string | null | undefined): boolean {
  return aiStatus === 'PENDING' || aiStatus === 'PROCESSING';
}

export function isAiEnrichmentTerminal(aiStatus: AiStatus | string | null | undefined): boolean {
  return aiStatus === 'COMPLETED' || aiStatus === 'FAILED';
}

export function documentsNeedEnrichmentPoll(
  documents: Array<{ aiStatus?: AiStatus | string | null }> | undefined,
): boolean {
  return Boolean(documents?.some((doc) => isAiEnrichmentPending(doc.aiStatus)));
}
