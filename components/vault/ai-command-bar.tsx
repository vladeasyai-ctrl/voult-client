'use client';

import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { useAiCommandBar } from '@/hooks/use-ai-command-bar';

export function AiCommandBar() {
  const {
    state,
    pendingPlan,
    feedback,
    error,
    submitCommand,
    confirmPlan,
    dismissPlan,
    clearFeedback,
  } = useAiCommandBar();

  const [input, setInput] = useState('');

  const isBusy = state === 'loading' || state === 'executing';

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => clearFeedback(), 4000);
    return () => clearTimeout(timer);
  }, [feedback, clearFeedback]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy || state === 'confirm') return;
    const text = input;
    setInput('');
    await submitCommand(text);
  };

  return (
    <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur-md">
      {(state === 'confirm' || state === 'executing') && pendingPlan && (
        <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/50 px-4 py-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{pendingPlan.reply}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {t('vault.confirmAiPlan', { count: pendingPlan.actions.length })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={confirmPlan}
              disabled={state === 'executing'}
              className="rounded-lg bg-[var(--color-accent)] p-2 text-white hover:opacity-90 disabled:opacity-50"
              title={t('common.confirm')}
            >
              {state === 'executing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </button>
            <button
              type="button"
              onClick={dismissPlan}
              disabled={state === 'executing'}
              className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
              title={t('common.cancel')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {error && state !== 'confirm' && (
          <Alert
            key={`${error.title}-${error.message}`}
            title={error.title}
            message={error.message}
            variant={error.variant}
            className="mb-3"
          />
        )}
      </AnimatePresence>

      {feedback && !error && state !== 'confirm' && (
        <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'relative flex min-w-0 items-center rounded-2xl border px-4 py-2.5 transition',
            'border-[var(--color-accent)]/35 bg-[var(--color-accent-soft)]/30',
            'shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_8px_24px_rgba(99,102,241,0.08)]',
            'focus-within:border-[var(--color-accent)] focus-within:bg-[var(--color-accent-soft)]/45',
            isBusy && 'opacity-80',
          )}
        >
          {state === 'loading' ? (
            <Loader2 size={16} className="mr-2 shrink-0 animate-spin text-[var(--color-accent)]" />
          ) : (
            <Sparkles size={16} className="mr-2 shrink-0 text-[var(--color-accent)]" />
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('vault.aiCommandPlaceholder')}
            disabled={isBusy || state === 'confirm'}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
      </form>
    </div>
  );
}
