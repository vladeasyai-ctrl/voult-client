'use client';

import { Bot, Link2, ScanText, Search, Sparkles, Upload } from 'lucide-react';
import { t } from '@/lib/i18n';

const features = [
  { icon: ScanText, label: 'OCR', hint: t('vault.comingSoon') },
  { icon: Sparkles, label: 'AI Summary', hint: t('vault.comingSoon') },
  { icon: Bot, label: 'AI Classification', hint: t('vault.comingSoon') },
  { icon: Search, label: 'Smart Search', hint: t('vault.comingSoon') },
  { icon: Upload, label: 'Telegram Uploads', hint: t('vault.comingSoon') },
  { icon: Link2, label: 'Shared Links', hint: t('vault.comingSoon') },
];

export function FutureFeatures() {
  return (
    <div className="mt-auto border-t border-[var(--color-border)] p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-[var(--color-muted)]">
        {t('vault.comingSoon')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {features.map(({ icon: Icon, label, hint }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]"
          >
            <Icon size={14} />
            <span>{label}</span>
            <span className="ml-auto opacity-60">{hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
