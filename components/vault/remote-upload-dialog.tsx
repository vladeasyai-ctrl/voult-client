'use client';

import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Smartphone, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { useRemoteUploadSession } from '@/hooks/use-remote-upload';

interface RemoteUploadDialogProps {
  open: boolean;
  onClose: () => void;
  parentId?: string | null;
}

function formatCountdown(expiresAt: string): string {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RemoteUploadDialog({ open, onClose, parentId }: RemoteUploadDialogProps) {
  const {
    session,
    uploadUrl,
    uploadedDocuments,
    error,
    loading,
    startSession,
    closeSession,
  } = useRemoteUploadSession();
  const [countdown, setCountdown] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    void startSession({ parentId });
  }, [open, parentId, startSession]);

  const handleClose = () => {
    void closeSession();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, closeSession]);

  useEffect(() => {
    if (!session?.expiresAt) {
      setCountdown('');
      return;
    }
    const tick = () => setCountdown(formatCountdown(session.expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt]);

  const isExpired = useMemo(() => {
    if (!session) return false;
    return session.status !== 'ACTIVE' || new Date(session.expiresAt).getTime() <= Date.now();
  }, [session]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              {t('vault.remoteUploadTitle')}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {t('vault.remoteUploadDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          {loading && (
            <p className="text-sm text-[var(--color-muted)]">{t('common.loading')}</p>
          )}

          {!loading && uploadUrl && !isExpired && (
            <>
              <div className="rounded-2xl bg-white p-4 shadow-inner">
                <QRCodeSVG value={uploadUrl} size={200} level="M" includeMargin />
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <Smartphone size={16} />
                <span>{t('vault.remoteUploadScanHint')}</span>
              </div>
              {countdown && (
                <p className="text-xs text-[var(--color-muted)]">
                  {t('vault.remoteUploadExpires', { time: countdown })}
                </p>
              )}
            </>
          )}

          {isExpired && (
            <p className="text-sm text-amber-600">{t('vault.remoteUploadExpired')}</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {uploadedDocuments.length > 0 && (
            <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                {t('vault.remoteUploadReceived')}
              </p>
              <ul className="space-y-2">
                {uploadedDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      'text-[var(--color-foreground)]',
                    )}
                  >
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    <span className="truncate">{doc.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {!isExpired && session && (
            <button
              type="button"
              onClick={() => {
                startedRef.current = false;
                void startSession({ parentId });
              }}
              className="rounded-xl px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
            >
              {t('vault.remoteUploadRefreshQr')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
