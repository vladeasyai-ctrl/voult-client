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
  if (target.mode === 'all') {
    if (presetId === 'home') {
      return homeLayoutBounds(target, false);
    }
    return measureNodeBounds(content, getStableOverviewTarget(presetId));
  }

  const bounds = measureNodeBounds(content, target);
  if (!bounds && presetId === 'home') {
    return homeLayoutBounds(target, true);
  }
  return bounds;
}

function stableContentSize(presetId: string, measured: { width: number; height: number }) {
  if (presetId === 'home') {
    return { width: HOME_CANVAS_W, height: HOME_CANVAS_H };
  }
  return measured;
}

function latchKey(presetId: string, target: DemoFocusTarget): string {
  return `${presetId}:${focusTargetKey(target)}`;
}

export function DemoViewport({ target, presetId, children }: DemoViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<DemoViewportFocus>(DEFAULT_FOCUS);
  const latchedBoundsRef = useRef<DemoRect | null>(null);
  const latchedScaleRef = useRef<number | null>(null);
  const latchedContentSizeRef = useRef<{ width: number; height: number } | null>(null);
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
    let bounds = resolveBounds(content, target, presetId);
    if (!bounds) return;

    if (latchedKeyRef.current !== key || latchedBoundsRef.current == null || latchedScaleRef.current == null) {
      latchedBoundsRef.current = bounds;
      latchedContentSizeRef.current = stableContentSize(presetId, measuredContentSize);
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

    const contentSize = latchedContentSizeRef.current ?? measuredContentSize;
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
