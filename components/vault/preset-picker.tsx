'use client';

import { motion } from 'framer-motion';
import { VAULT_PRESETS, type VaultPreset } from '@/lib/presets';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface PresetPickerProps {
  onSelect: (preset: VaultPreset) => void;
  onSkip: () => void;
}

export function PresetPicker({ onSelect, onSkip }: PresetPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {t('vault.welcome')}
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          {t('vault.presetPickerTitle')}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
          {t('vault.presetPickerSubtitle')}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {VAULT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={cn(
                'rounded-2xl border border-[var(--color-border)] p-5 text-left transition',
                'hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-lg',
              )}
            >
              <span className="text-3xl">{preset.emoji}</span>
              <p className="mt-3 text-lg font-medium">{preset.label}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{preset.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {preset.branches.map((b) => (
                  <span
                    key={b.name}
                    className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs text-[var(--color-accent)]"
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="mt-6 text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
        >
          {t('vault.skipPreset')}
        </button>
      </motion.div>
    </div>
  );
}
