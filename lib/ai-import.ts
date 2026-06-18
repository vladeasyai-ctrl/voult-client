/** Files supported by AI import (backend OpenAiDocumentAiAnalyzer). */
export function isAiImportFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (file.type === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}

export const AI_IMPORT_ACCEPT = 'image/*,application/pdf,.pdf';

export const AI_IMPORT_UNSUPPORTED_HINT =
  'AI-импорт поддерживает фото (image/*) и PDF';
