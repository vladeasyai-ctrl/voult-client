'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { AiSettings, UpdateAiSettingsPayload } from '@/lib/types';

const inputClassName =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]';

interface AiSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AiSettings | null;
  onSave: (payload: UpdateAiSettingsPayload) => Promise<AiSettings>;
}

export function AiSettingsDialog({ open, onClose, settings, onSave }: AiSettingsDialogProps) {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open || !settings) return;
    setProvider(settings.provider);
    setModel(settings.model);
    setBaseUrl(settings.baseUrl);
    setApiKey('');
  }, [open, settings]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({
        provider,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setApiKey('');
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 800);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
        <h3 className="font-[family-name:var(--font-display)] text-lg">Настройки AI</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Провайдер">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className={inputClassName}
            >
              <option value="openai">OpenAI</option>
            </select>
          </Field>
          <Field label="API key">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.apiKeyConfigured ? `Сохранён: ${settings.apiKeyHint}` : 'sk-...'}
              className={inputClassName}
            />
          </Field>
          <Field label="Модель">
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={settings?.model ?? 'gpt-4o-mini'}
              className={inputClassName}
            />
          </Field>
          <Field label="Base URL">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={settings?.baseUrl ?? 'https://api.openai.com/v1'}
              className={inputClassName}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saved ? 'Сохранено' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}
