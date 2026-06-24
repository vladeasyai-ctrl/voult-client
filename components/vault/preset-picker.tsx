'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  VAULT_PRESETS,
  getDisplayBranches,
  type HomeHousingType,
  type PresetSelection,
  type VaultPreset,
} from '@/lib/presets';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

export type PresetPickerMode = 'onboarding' | 'add';

interface PresetPickerProps {
  mode: PresetPickerMode;
  onSelect: (selection: PresetSelection) => void;
  onSkip?: () => void;
  onCancel?: () => void;
  onEmptySpace?: () => void;
}

function PresetBranchChips({ branches }: { branches: { name: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {branches.map((b) => (
        <span
          key={b.name}
          className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs text-[var(--color-accent)]"
        >
          {b.name}
        </span>
      ))}
    </div>
  );
}

function PresetCard({
  preset,
  onClick,
}: {
  preset: VaultPreset;
  onClick: () => void;
}) {
  const previewBranches = getDisplayBranches(
    preset,
    preset.id === 'home' ? 'rent' : null,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-[var(--color-border)] p-5 text-left transition',
        'hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-lg',
      )}
    >
      <span className="text-3xl">{preset.emoji}</span>
      <p className="mt-3 text-lg font-medium">{preset.label}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{preset.description}</p>
      {previewBranches.length > 0 && <PresetBranchChips branches={previewBranches} />}
    </button>
  );
}

export function PresetPicker({
  mode,
  onSelect,
  onSkip,
  onCancel,
  onEmptySpace,
}: PresetPickerProps) {
  const [configuringHome, setConfiguringHome] = useState(false);
  const [housingType, setHousingType] = useState<HomeHousingType>('rent');

  const homePreset = VAULT_PRESETS.find((p) => p.id === 'home')!;
  const homeBranches = getDisplayBranches(homePreset, housingType);
  const isOnboarding = mode === 'onboarding';

  const handlePresetClick = (preset: VaultPreset) => {
    if (preset.requiresOnboarding === 'housingType') {
      setConfiguringHome(true);
      setHousingType('rent');
      return;
    }
    onSelect({ preset });
  };

  const handleCreateHome = () => {
    onSelect({ preset: homePreset, housingType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl"
      >
        {!isOnboarding && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-5 top-5 rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
            title={t('common.close')}
          >
            <X size={18} />
          </button>
        )}

        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {isOnboarding ? t('vault.welcome') : t('vault.storageMap')}
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          {isOnboarding ? t('vault.presetPickerTitle') : t('vault.presetPickerAddTitle')}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
          {isOnboarding ? t('vault.presetPickerSubtitle') : t('vault.presetPickerAddSubtitle')}
        </p>

        <AnimatePresence mode="wait">
          {configuringHome ? (
            <motion.div
              key="home-config"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="mt-8"
            >
              <div className="rounded-2xl border border-[var(--color-border)] p-5">
                <span className="text-3xl">{homePreset.emoji}</span>
                <p className="mt-3 text-lg font-medium">{homePreset.label}</p>
                <p className="mt-4 text-sm font-medium">{t('presets.home.rentalQuestion')}</p>

                <div className="mt-3 flex gap-2">
                  {(['rent', 'own'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHousingType(type)}
                      className={cn(
                        'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                        housingType === type
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)]',
                      )}
                    >
                      {type === 'rent' ? t('presets.home.rental') : t('presets.home.own')}
                    </button>
                  ))}
                </div>

                <PresetBranchChips branches={homeBranches} />
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateHome}
                  className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {t('vault.presetCreate')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfiguringHome(false)}
                  className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
                >
                  {t('vault.presetBack')}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preset-grid"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {VAULT_PRESETS.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onClick={() => handlePresetClick(preset)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!configuringHome && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            {isOnboarding && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
              >
                {t('vault.skipPreset')}
              </button>
            )}
            {!isOnboarding && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
              >
                {t('vault.presetCancel')}
              </button>
            )}
            {!isOnboarding && onEmptySpace && (
              <button
                type="button"
                onClick={onEmptySpace}
                className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
              >
                {t('vault.presetEmptySpace')}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
