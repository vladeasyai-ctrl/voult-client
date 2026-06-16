'use client';

import { Check, Loader2, Settings2, Sparkles, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAiCommandBar } from '@/hooks/use-ai-command-bar';
import { AiSettingsDialog } from '@/components/vault/ai-settings-dialog';

export function AiCommandBar() {
  const {
    settings,
    state,
    pendingPlan,
    feedback,
    error,
    loadSettings,
    saveSettings,
    submitCommand,
    confirmPlan,
    dismissPlan,
    clearFeedback,
  } = useAiCommandBar();

  const [input, setInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <>
      <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur-md">
        {state === 'confirm' && pendingPlan && (
          <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/50 px-4 py-3">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{pendingPlan.reply}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Подтвердите выполнение ({pendingPlan.actions.length}{' '}
                {pendingPlan.actions.length === 1 ? 'действие' : 'действия'})
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={confirmPlan}
                disabled={state === 'executing'}
                className="rounded-lg bg-[var(--color-accent)] p-2 text-white hover:opacity-90 disabled:opacity-50"
                title="Подтвердить"
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
                title="Отмена"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {(feedback || error) && state !== 'confirm' && (
          <div
            className={cn(
              'mb-3 rounded-xl px-4 py-2 text-sm',
              error
                ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                : 'border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300',
            )}
          >
            {error ?? feedback}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div
            className={cn(
              'relative flex min-w-0 flex-1 items-center rounded-2xl border px-4 py-2.5 transition',
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
              placeholder={
                settings?.apiKeyConfigured
                  ? 'Быстрая команда: создай папку Дом, удали стоматолог…'
                  : 'Настройте API-ключ AI справа, затем пишите команды'
              }
              disabled={isBusy || state === 'confirm'}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              loadSettings().finally(() => setSettingsOpen(true));
            }}
            className="rounded-xl border border-[var(--color-border)] p-2.5 text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            title="Настройки AI"
          >
            <Settings2 size={16} />
          </button>
        </form>
      </div>

      <AiSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </>
  );
}
