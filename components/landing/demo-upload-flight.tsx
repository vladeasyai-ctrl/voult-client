'use client';

import { motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HOME_CANVAS_H, HOME_CANVAS_W } from '@/lib/demo-home-layout';
import { DemoFileChip } from './demo-shared';

function pct(x: number, y: number) {
  return {
    left: `${(x / HOME_CANVAS_W) * 100}%`,
    top: `${(y / HOME_CANVAS_H) * 100}%`,
  };
}

const RADIAL_START = pct(300, 88);
const RADIAL_FOLDER = pct(548, 72);
const RADIAL_SLOT = pct(582, 158);

interface DemoRadialUploadFlightProps {
  phase: 'route' | 'placed';
  fileName: string;
  onLanded: () => void;
}

export function DemoRadialUploadFlight({ phase, fileName, onLanded }: DemoRadialUploadFlightProps) {
  const landedRef = useRef(false);

  useEffect(() => {
    landedRef.current = false;
    if (phase !== 'placed') return;
    const id = window.setTimeout(() => {
      if (!landedRef.current) {
        landedRef.current = true;
        onLanded();
      }
    }, 820);
    return () => window.clearTimeout(id);
  }, [phase, onLanded]);

  const target = phase === 'route' ? RADIAL_FOLDER : RADIAL_SLOT;

  return (
    <motion.div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      initial={
        phase === 'route'
          ? { ...RADIAL_START, opacity: 0, scale: 0.8 }
          : false
      }
      animate={{
        ...target,
        opacity: 1,
        scale: phase === 'placed' ? 0.88 : 1,
      }}
      transition={
        phase === 'route'
          ? { duration: 1.3, ease: [0.33, 0.72, 0.15, 1], delay: 0.15 }
          : { duration: 0.78, ease: [0.34, 1.35, 0.64, 1] }
      }
      onAnimationComplete={() => {
        if (phase === 'placed' && !landedRef.current) {
          landedRef.current = true;
          onLanded();
        }
      }}
    >
      <DemoFileChip filename={fileName} compact />
      {phase === 'placed' && (
        <motion.div
          className="absolute inset-0 rounded-xl ring-2 ring-[var(--color-accent)]"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  );
}

interface Point {
  x: number;
  y: number;
}

function relativeCenter(el: HTMLElement, container: HTMLElement): Point {
  const cr = container.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return {
    x: er.left + er.width / 2 - cr.left,
    y: er.top + er.height / 2 - cr.top,
  };
}

interface DemoTreeUploadFlightProps {
  phase: 'route' | 'placed';
  fileName: string;
  containerRef: React.RefObject<HTMLElement | null>;
  folderRef: React.RefObject<HTMLElement | null>;
  slotRef: React.RefObject<HTMLElement | null>;
  onLanded: () => void;
}

export function DemoTreeUploadFlight({
  phase,
  fileName,
  containerRef,
  folderRef,
  slotRef,
  onLanded,
}: DemoTreeUploadFlightProps) {
  const [points, setPoints] = useState<{ start: Point; folder: Point; slot: Point } | null>(null);
  const landedRef = useRef(false);

  const measure = () => {
    const container = containerRef.current;
    const folder = folderRef.current;
    const slot = slotRef.current;
    if (!container || !folder || !slot) return;

    const cr = container.getBoundingClientRect();
    setPoints({
      start: { x: cr.width * 0.42, y: cr.height * 0.12 },
      folder: relativeCenter(folder, container),
      slot: relativeCenter(slot, container),
    });
  };

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, folderRef, slotRef]);

  useEffect(() => {
    landedRef.current = false;
    if (phase !== 'placed') return;
    const id = window.setTimeout(() => {
      if (!landedRef.current) {
        landedRef.current = true;
        onLanded();
      }
    }, 820);
    return () => window.clearTimeout(id);
  }, [phase, onLanded]);

  if (!points) return null;

  const target = phase === 'route' ? points.folder : points.slot;

  return (
    <motion.div
      className="pointer-events-none absolute z-30"
      style={{ x: 0, y: 0 }}
      initial={
        phase === 'route'
          ? { left: points.start.x, top: points.start.y, x: '-50%', y: '-50%', opacity: 0, scale: 0.8 }
          : false
      }
      animate={{
        left: target.x,
        top: target.y,
        x: '-50%',
        y: '-50%',
        opacity: 1,
        scale: phase === 'placed' ? 0.88 : 1,
      }}
      transition={
        phase === 'route'
          ? { duration: 1.3, ease: [0.33, 0.72, 0.15, 1], delay: 0.15 }
          : { duration: 0.78, ease: [0.34, 1.35, 0.64, 1] }
      }
      onAnimationComplete={() => {
        if (phase === 'placed' && !landedRef.current) {
          landedRef.current = true;
          onLanded();
        }
      }}
    >
      <DemoFileChip filename={fileName} compact />
      {phase === 'placed' && (
        <motion.div
          className="absolute inset-0 rounded-xl ring-2 ring-[var(--color-accent)]"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  );
}

export function useDemoDocLanding(showNewDoc: boolean, phase: string, presetId: string) {
  const [docVisible, setDocVisible] = useState(false);

  useEffect(() => {
    if (!showNewDoc) {
      setDocVisible(false);
      return;
    }
    if (phase === 'placed') {
      setDocVisible(false);
      return;
    }
    setDocVisible(true);
  }, [showNewDoc, phase, presetId]);

  return { docVisible, onDocLanded: () => setDocVisible(true) };
}
