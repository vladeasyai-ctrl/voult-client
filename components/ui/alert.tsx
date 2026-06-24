'use client';

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AlertVariant } from '@/lib/errors';

const styles: Record<
  AlertVariant,
  { container: string; icon: string; title: string; message: string; Icon: typeof AlertCircle }
> = {
  error: {
    container: 'border-red-200/80 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    message: 'text-red-700/90 dark:text-red-200/80',
    Icon: AlertCircle,
  },
  warning: {
    container: 'border-amber-200/80 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    message: 'text-amber-800/90 dark:text-amber-200/80',
    Icon: AlertTriangle,
  },
  info: {
    container: 'border-sky-200/80 bg-sky-50/90 dark:border-sky-900/40 dark:bg-sky-950/30',
    icon: 'text-sky-600 dark:text-sky-400',
    title: 'text-sky-900 dark:text-sky-100',
    message: 'text-sky-800/90 dark:text-sky-200/80',
    Icon: Info,
  },
};

interface AlertProps {
  title: string;
  message?: string;
  variant?: AlertVariant;
  className?: string;
}

export function Alert({ title, message, variant = 'error', className }: AlertProps) {
  const style = styles[variant];
  const Icon = style.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex gap-3 rounded-2xl border px-4 py-3.5 shadow-sm',
        style.container,
        className,
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', style.icon)} aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className={cn('text-sm font-medium leading-snug', style.title)}>{title}</p>
        {message && (
          <p className={cn('text-sm leading-relaxed', style.message)}>{message}</p>
        )}
      </div>
    </motion.div>
  );
}
