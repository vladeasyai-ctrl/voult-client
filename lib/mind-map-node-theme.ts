/**
 * Mind-map node appearance. Tune in `app/globals.css`:
 * --mind-map-node-width, --mind-map-node-height,
 * --mind-map-node-font-size, --mind-map-node-padding,
 * --mind-map-action-size, --mind-map-action-icon-size, --mind-map-action-gap
 */

export const DEFAULT_NODE_WIDTH = 196;
export const DEFAULT_NODE_HEIGHT = 60;
export const DEFAULT_NODE_FONT_SIZE = '1.75rem';
export const DEFAULT_NODE_PADDING = '14px';
export const DEFAULT_ACTION_SIZE = 56;
export const DEFAULT_ACTION_ICON_SIZE = 26;
export const DEFAULT_ACTION_GAP = 10;
export const MAX_NODE_NAME_LENGTH = 64;

export interface MindMapNodeDims {
  width: number;
  height: number;
  fontSize: string;
  padding: string;
}

export interface MindMapActionDims {
  size: number;
  iconSize: number;
  gap: number;
}

function readCssLength(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function readCssNumber(varName: string, fallback: number): number {
  const raw = readCssLength(varName, String(fallback));
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readMindMapNodeDims(): MindMapNodeDims {
  return {
    width: readCssNumber('--mind-map-node-width', DEFAULT_NODE_WIDTH),
    height: readCssNumber('--mind-map-node-height', DEFAULT_NODE_HEIGHT),
    fontSize: readCssLength('--mind-map-node-font-size', DEFAULT_NODE_FONT_SIZE),
    padding: readCssLength('--mind-map-node-padding', DEFAULT_NODE_PADDING),
  };
}

export function readMindMapActionDims(): MindMapActionDims {
  const nodeHeight = readCssNumber('--mind-map-node-height', DEFAULT_NODE_HEIGHT);
  const cssSize = readCssNumber('--mind-map-action-size', DEFAULT_ACTION_SIZE);
  const cssIcon = readCssNumber('--mind-map-action-icon-size', DEFAULT_ACTION_ICON_SIZE);
  const size = Math.max(cssSize, Math.round(nodeHeight * 0.92));
  const iconSize = Math.max(cssIcon, Math.round(size * 0.46));
  return {
    size,
    iconSize,
    gap: readCssNumber('--mind-map-action-gap', DEFAULT_ACTION_GAP),
  };
}

export function getMindMapNodeWidth(): number {
  return readMindMapNodeDims().width;
}

export function getMindMapNodeHeight(): number {
  return readMindMapNodeDims().height;
}

function lengthToPx(value: string): number {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  if (value.endsWith('rem')) return n * 16;
  if (value.endsWith('px')) return n;
  return n;
}

function readMindMapFontFamily(): string {
  if (typeof document === 'undefined') return 'DM Sans, ui-sans-serif, system-ui, sans-serif';
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-sans')
    .trim();
  return family || 'DM Sans, ui-sans-serif, system-ui, sans-serif';
}

let measureCtx: CanvasRenderingContext2D | null = null;

function measureLabelWidth(text: string, fontSize: string, fontFamily: string): number {
  const fontSizePx = lengthToPx(fontSize);
  const sample = text || ' ';

  if (typeof document !== 'undefined') {
    if (!measureCtx) {
      const canvas = document.createElement('canvas');
      measureCtx = canvas.getContext('2d');
    }
    if (measureCtx) {
      measureCtx.font = `500 ${fontSizePx}px ${fontFamily}`;
      return measureCtx.measureText(sample).width;
    }
  }

  return sample.length * fontSizePx * 0.52;
}

/** Minimum box width from CSS; grows with label up to ~64 characters. */
export function resolveMindMapNodeWidth(name: string, isFolder: boolean): number {
  const dims = readMindMapNodeDims();
  const minWidth = dims.width;
  const fontFamily = readMindMapFontFamily();
  const horizontalPadding = lengthToPx(dims.padding) * 2;
  const iconBlock = isFolder ? 32 + 8 : 32 + 4;
  const gripReserve = 14;

  const label = name.slice(0, MAX_NODE_NAME_LENGTH);
  const labelWidth = measureLabelWidth(label, dims.fontSize, fontFamily);
  const maxLabelWidth = measureLabelWidth(
    'M'.repeat(MAX_NODE_NAME_LENGTH),
    dims.fontSize,
    fontFamily,
  );

  const contentWidth = iconBlock + gripReserve + labelWidth;
  const maxContentWidth = iconBlock + gripReserve + maxLabelWidth;

  const resolved = Math.ceil(horizontalPadding + contentWidth);
  const maxWidth = Math.ceil(horizontalPadding + maxContentWidth);

  return Math.min(maxWidth, Math.max(minWidth, resolved));
}
