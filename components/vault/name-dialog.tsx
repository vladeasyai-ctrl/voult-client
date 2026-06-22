'use client';

import { motion } from 'framer-motion';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

export const MAX_NAME_LENGTH = 64;

const inputClassName =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]';

export function validateName(
  name: string,
  options: { checkDuplicates?: boolean; existingNames?: string[] } = {},
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return t('validation.nameRequired');
  if (trimmed.length > MAX_NAME_LENGTH) {
    return t('validation.nameTooLong', { max: MAX_NAME_LENGTH });
  }
  if (options.checkDuplicates && options.existingNames) {
    const lower = trimmed.toLowerCase();
    if (options.existingNames.some((n) => n.toLowerCase() === lower)) {
      return t('validation.duplicateBranch');
    }
  }
  return null;
}

interface NameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  suggestions?: string[];
  existingNames?: string[];
  checkDuplicates?: boolean;
}

export function NameDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = t('common.name'),
  confirmLabel = t('common.create'),
  suggestions,
  existingNames = [],
  checkDuplicates = false,
}: NameDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const error = validateName(name, { checkDuplicates, existingNames });
  const canSubmit = !error;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(name.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              maxLength={MAX_NAME_LENGTH}
              className={cn(
                inputClassName,
                error && name.length > 0 && 'border-red-400 focus:border-red-400',
              )}
            />
            {error && name.length > 0 && (
              <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
            <p className="mt-1.5 text-right text-xs text-[var(--color-muted)]">
              {name.trim().length}/{MAX_NAME_LENGTH}
            </p>
          </div>

          {suggestions && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setName(suggestion)}
                  className={cn(
                    'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs transition',
                    'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]',
                    name === suggestion &&
                      'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
