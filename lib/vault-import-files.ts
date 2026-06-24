import { resolveFileType, type FileTypeKind } from '@/lib/file-type';

/** File kinds with import, preview, and AI analysis support. */
export const VAULT_IMPORT_FILE_KINDS: FileTypeKind[] = [
  'image',
  'pdf',
  'text',
  'word',
  'excel',
];

export function isVaultImportFile(file: File): boolean {
  const { kind } = resolveFileType(file.type || null, file.name);
  return VAULT_IMPORT_FILE_KINDS.includes(kind);
}

export const VAULT_IMPORT_ACCEPT = [
  'image/*',
  '.pdf',
  'application/pdf',
  '.txt',
  '.md',
  '.csv',
  'text/plain',
  'text/csv',
  '.doc',
  '.docx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls',
  '.xlsx',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',');

export function isVaultImportPreviewKind(kind: FileTypeKind): boolean {
  return VAULT_IMPORT_FILE_KINDS.includes(kind);
}
