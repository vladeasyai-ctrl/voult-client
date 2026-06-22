export type FileTypeKind =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'text'
  | 'archive'
  | 'video'
  | 'generic';

export interface ResolvedFileType {
  kind: FileTypeKind;
  label: string;
  extension: string;
}

const EXTENSION_MAP: Record<string, FileTypeKind> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  rtf: 'word',
  odt: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  ods: 'excel',
  ppt: 'powerpoint',
  pptx: 'powerpoint',
  odp: 'powerpoint',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  heic: 'image',
  heif: 'image',
  tiff: 'image',
  tif: 'image',
  txt: 'text',
  md: 'text',
  markdown: 'text',
  json: 'text',
  xml: 'text',
  html: 'text',
  htm: 'text',
  log: 'text',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  webm: 'video',
  mkv: 'video',
};

const MIME_MAP: Array<[RegExp, FileTypeKind, string]> = [
  [/pdf/i, 'pdf', 'pdf'],
  [/word|msword|wordprocessing/i, 'word', 'docx'],
  [/excel|spreadsheet|csv/i, 'excel', 'xlsx'],
  [/powerpoint|presentation/i, 'powerpoint', 'pptx'],
  [/^image\//i, 'image', 'img'],
  [/^text\//i, 'text', 'txt'],
  [/json|xml|javascript/i, 'text', 'txt'],
  [/zip|compressed|rar|7z|tar|gzip/i, 'archive', 'zip'],
  [/^video\//i, 'video', 'mp4'],
];

function extensionFromFilename(filename?: string | null): string {
  if (!filename) return '';
  const base = filename.trim().split(/[/\\]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

function labelForKind(kind: FileTypeKind, extension: string): string {
  if (extension) return extension.toLowerCase();
  switch (kind) {
    case 'pdf':
      return 'pdf';
    case 'word':
      return 'docx';
    case 'excel':
      return 'xlsx';
    case 'powerpoint':
      return 'pptx';
    case 'image':
      return 'img';
    case 'text':
      return 'txt';
    case 'archive':
      return 'zip';
    case 'video':
      return 'mp4';
    default:
      return 'file';
  }
}

export function resolveFileType(
  mimeType?: string | null,
  filename?: string | null,
): ResolvedFileType {
  const extension = extensionFromFilename(filename);

  if (extension && EXTENSION_MAP[extension]) {
    const kind = EXTENSION_MAP[extension];
    return { kind, label: labelForKind(kind, extension), extension };
  }

  if (mimeType) {
    for (const [pattern, kind, fallbackExt] of MIME_MAP) {
      if (pattern.test(mimeType)) {
        return {
          kind,
          label: labelForKind(kind, extension || fallbackExt),
          extension: extension || fallbackExt,
        };
      }
    }
  }

  return {
    kind: 'generic',
    label: extension || 'file',
    extension: extension || 'file',
  };
}
