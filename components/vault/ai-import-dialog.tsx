'use client';

import { Loader2, QrCode, Sparkles, Upload, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { AI_IMPORT_ACCEPT, isAiImportFile } from '@/lib/ai-import';
import { t } from '@/lib/i18n';
import type { DropTarget } from '@/lib/types';
import { useRemoteUploadSession } from '@/hooks/use-remote-upload';
import { useVaultStore } from '@/stores/vault-store';

type ImportTab = 'file' | 'qr';

interface AiImportDialogProps {
  open: boolean;
  onClose: () => void;
  onEnqueue: (files: File[], dropTarget?: DropTarget | null) => void;
  onEnqueueImportSession: (importId: string, dropTarget?: DropTarget | null) => void;
}

function formatCountdown(expiresAt: string): string {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AiImportDialog({
  open,
  onClose,
  onEnqueue,
  onEnqueueImportSession,
}: AiImportDialogProps) {
  const [busy, setBusy] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [tab, setTab] = useState<ImportTab>('file');
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);
  const startedRef = useRef(false);
  const {
    session,
    uploadUrl,
    error: qrError,
    loading: qrLoading,
    startSession,
    closeSession,
  } = useRemoteUploadSession();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      void closeSession();
      setTab('file');
      return;
    }
    if (tab !== 'qr') {
      if (startedRef.current) {
        startedRef.current = false;
        void closeSession();
      }
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    void startSession({
      parentId: selectedFolderId,
      mode: 'AI_IMPORT',
      onImportCreated: (importId) => {
        onEnqueueImportSession(
          importId,
          selectedFolderId ? { kind: 'folder', nodeId: selectedFolderId } : null,
        );
      },
    });
  }, [open, tab, selectedFolderId, startSession, closeSession, onEnqueueImportSession]);

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

  const handleClose = () => {
    void closeSession();
    onClose();
  };

  if (!open) return null;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(isAiImportFile);
    if (files.length === 0) {
      setPickError(t('vault.aiImportSupported'));
      return;
    }
    setPickError(null);
    setBusy(true);
    onEnqueue(files, selectedFolderId ? { kind: 'folder', nodeId: selectedFolderId } : null);
    setBusy(false);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-accent)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg">{t('vault.aiImportTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-[var(--color-border)] p-2">
          <TabButton active={tab === 'file'} onClick={() => setTab('file')} icon={Upload} label={t('vault.aiImportFromComputer')} />
          <TabButton active={tab === 'qr'} onClick={() => setTab('qr')} icon={QrCode} label={t('vault.aiImportFromPhone')} />
        </div>

        <div className="space-y-4 p-5">
          {tab === 'file' && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center hover:border-[var(--color-accent)]">
              {busy ? (
                <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
              ) : (
                <Sparkles size={24} className="text-[var(--color-accent)]" />
              )}
              <span className="text-sm">{t('vault.aiImportPickFile')}</span>
              <span className="text-xs text-[var(--color-muted)]">{t('vault.aiImportSupported')}</span>
              {pickError && (
                <span className="text-xs text-amber-600 dark:text-amber-400">{pickError}</span>
              )}
              <input
                type="file"
                accept={AI_IMPORT_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}

          {tab === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              {qrLoading && (
                <p className="text-sm text-[var(--color-muted)]">{t('common.loading')}</p>
              )}
              {!qrLoading && uploadUrl && !isExpired && (
                <>
                  <div className="rounded-2xl bg-white p-4 shadow-inner">
                    <QRCodeSVG value={uploadUrl} size={180} level="M" includeMargin />
                  </div>
                  <p className="text-center text-sm text-[var(--color-muted)]">
                    {t('vault.aiImportQrHint')}
                  </p>
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
              {qrError && <p className="text-sm text-red-500">{qrError}</p>}
              {!isExpired && session && (
                <button
                  type="button"
                  onClick={() => {
                    startedRef.current = false;
                    void startSession({
                      parentId: selectedFolderId,
                      mode: 'AI_IMPORT',
                      onImportCreated: (importId) => {
                        onEnqueueImportSession(
                          importId,
                          selectedFolderId ? { kind: 'folder', nodeId: selectedFolderId } : null,
                        );
                      },
                    });
                  }}
                  className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                >
                  {t('vault.remoteUploadRefreshQr')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'rounded-xl px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
            )}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        active
          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
          : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
