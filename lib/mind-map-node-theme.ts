/**
 * Mind-map node appearance. Tune in `app/globals.css`:
 * --mind-map-node-width, --mind-map-node-height,
 * --mind-map-node-font-size, --mind-map-node-padding
 */

export const DEFAULT_NODE_WIDTH = 196;
export const DEFAULT_NODE_HEIGHT = 60;
export const DEFAULT_NODE_FONT_SIZE = '1.75rem';
export const DEFAULT_NODE_PADDING = '4px';

export interface MindMapNodeDims {
  width: number;
  height: number;
  fontSize: string;
  padding: string;
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

export function getMindMapNodeWidth(): number {
  return readMindMapNodeDims().width;
}

export function getMindMapNodeHeight(): number {
  return readMindMapNodeDims().height;
}
