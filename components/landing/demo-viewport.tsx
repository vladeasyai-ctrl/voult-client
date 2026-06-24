'use client';

import { motion } from 'framer-motion';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  computeViewportTransform,
  focusPadding,
  focusTargetKey,
  getStableOverviewTarget,
  homeLayoutBounds,
  measureNodeBounds,
  type DemoFocusTarget,
  type DemoRect,
  type DemoViewportFocus,
} from '@/lib/demo-focus';
import { HOME_CANVAS_H, HOME_CANVAS_W } from '@/lib/demo-home-layout';

const DEFAULT_FOCUS: DemoViewportFocus = { scale: 1, x: 0, y: 0 };

interface DemoViewportProps {
  target: DemoFocusTarget;
  presetId: string;
  children: React.ReactNode;
}

function resolveBounds(
  content: HTMLElement,
  target: DemoFocusTarget,
  presetId: string,
): DemoRect | null {
  const boundsRoot =
    presetId === 'work' ? (content.querySelector<HTMLElement>('[data-demo-scene]') ?? content) : content;

  if (target.mode === 'all') {
    if (presetId === 'home') {
      return homeLayoutBounds(target, false);
    }
    return measureNodeBounds(boundsRoot, getStableOverviewTarget(presetId));
  }

  const bounds = measureNodeBounds(boundsRoot, target);
  if (!bounds && presetId === 'home') {
    return homeLayoutBounds(target, true);
  }
  return bounds;
}

function stableContentSize(
  presetId: string,
  content: HTMLElement,
  measured: { width: number; height: number },
) {
  if (presetId === 'home') {
    return { width: HOME_CANVAS_W, height: HOME_CANVAS_H };
  }

  const scene = content.querySelector<HTMLElement>('[data-demo-scene]');
  if (!scene) return measured;

  const sceneRect = scene.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  return {
    width: measured.width,
    height: measured.height,
    offsetX: sceneRect.left - contentRect.left,
    offsetY: sceneRect.top - contentRect.top,
  };
}

type ContentMetrics = {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};

function latchKey(presetId: string, target: DemoFocusTarget): string {
  return `${presetId}:${focusTargetKey(target)}`;
}

export function DemoViewport({ target, presetId, children }: DemoViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<DemoViewportFocus>(DEFAULT_FOCUS);
  const latchedBoundsRef = useRef<DemoRect | null>(null);
  const latchedScaleRef = useRef<number | null>(null);
  const latchedContentSizeRef = useRef<ContentMetrics | null>(null);
  const latchedTransformRef = useRef<DemoViewportFocus | null>(null);
  const latchedKeyRef = useRef<string | null>(null);

  const remeasure = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const viewportSize = {
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    };
    const measuredContentSize = {
      width: content.offsetWidth,
      height: content.offsetHeight,
    };

    if (viewportSize.width < 1 || measuredContentSize.width < 1) return;

    const key = latchKey(presetId, target);

    // Focused view: latch scale + pan once; ignore resize and panel open/close.
    if (target.mode === 'nodes') {
      if (latchedKeyRef.current === key && latchedTransformRef.current) {
        setFocus(latchedTransformRef.current);
        return;
      }

      const bounds = resolveBounds(content, target, presetId);
      if (!bounds) return;

      const contentSize = stableContentSize(presetId, content, measuredContentSize);
      const next = computeViewportTransform(
        bounds,
        contentSize,
        viewportSize,
        focusPadding(target),
      );

      latchedKeyRef.current = key;
      latchedBoundsRef.current = bounds;
      latchedContentSizeRef.current = contentSize;
      latchedScaleRef.current = next.scale;
      latchedTransformRef.current = next;
      setFocus(next);
      return;
    }

    latchedTransformRef.current = null;

    let bounds = resolveBounds(content, target, presetId);
    if (!bounds) return;

    if (latchedKeyRef.current !== key || latchedBoundsRef.current == null || latchedScaleRef.current == null) {
      latchedBoundsRef.current = bounds;
      latchedContentSizeRef.current = stableContentSize(presetId, content, measuredContentSize);
      latchedScaleRef.current = computeViewportTransform(
        bounds,
        latchedContentSizeRef.current,
        viewportSize,
        focusPadding(target),
      ).scale;
      latchedKeyRef.current = key;
    } else {
      bounds = latchedBoundsRef.current;
    }

    const contentSize: ContentMetrics = latchedContentSizeRef.current ?? measuredContentSize;
    const padding = focusPadding(target);
    const next = computeViewportTransform(
      bounds,
      contentSize,
      viewportSize,
      padding,
      latchedScaleRef.current,
    );

    setFocus((prev) =>
      Math.abs(prev.scale - next.scale) < 0.0001 &&
      Math.abs(prev.x - next.x) < 0.5 &&
      Math.abs(prev.y - next.y) < 0.5
        ? prev
        : next,
    );
  }, [target, presetId]);

  useLayoutEffect(() => {
    remeasure();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => remeasure());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [remeasure]);

  return (
    <div ref={viewportRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <motion.div
        className="will-change-transform"
        animate={{ scale: focus.scale, x: focus.x, y: focus.y }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        style={{ transformOrigin: 'center center' }}
      >
        <div ref={contentRef} className="inline-block p-6 sm:p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
