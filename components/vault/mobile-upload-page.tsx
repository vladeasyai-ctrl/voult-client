'use client';

import { CheckCircle2, ImagePlus, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { VAULT_IMPORT_ACCEPT } from '@/lib/vault-import-files';
import {
  getRemoteUploadPublicSession,
  uploadViaRemoteToken,
  type RemoteUploadPublicSession,
} from '@/lib/remote-upload';
import type { Document } from '@/lib/types';

interface MobileUploadPageProps {
  token: string;
}

export function MobileUploadPage({ token }: MobileUploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<RemoteUploadPublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<Document[]>([]);
  const [importCount, setImportCount] = useState(0);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getRemoteUploadPublicSession(token);
      setSession(info);
      if (!info.valid) {
        setError(t('vault.remoteUploadExpired'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !session?.valid) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        setProgress(0);
        const result = await uploadViaRemoteToken(token, file, setProgress);
        if (result.document) {
          setUploaded((prev) => [...prev, result.document!]);
        } else if (result.importId) {
          setImportCount((count) => count + 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.codes.UPLOAD_FAILED'));
        break;
      }
    }

    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
    await refreshSession();
  };

  const valid = session?.valid ?? false;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)]">
      <header className="border-b border-[var(--color-border)] px-5 py-4">
        <h1 className="font-[family-name:var(--font-display)] text-xl">
          {t('vault.remoteUploadMobileTitle')}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {session?.mode === 'AI_IMPORT'
            ? t('vault.aiImportMobileHint')
            : t('vault.remoteUploadMobileHint')}
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-5">
        {loading && (
          <p className="text-sm text-[var(--color-muted)]">{t('common.loading')}</p>
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {valid && (
          <>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed',
                'border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center',
                'transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]',
                uploading && 'pointer-events-none opacity-60',
              )}
            >
              {uploading ? (
                <>
                  <Upload size={32} className="text-[var(--color-accent)]" />
                  <span className="text-sm font-medium">
                    {t('vault.remoteUploadUploading', { percent: progress })}
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus size={32} className="text-[var(--color-accent)]" />
                  <span className="text-base font-medium">{t('vault.remoteUploadPickFiles')}</span>
                  <span className="text-sm text-[var(--color-muted)]">
                    {t('vault.remoteUploadPickFilesHint')}
                  </span>
                </>
              )}
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={
                session?.mode === 'AI_IMPORT' ? VAULT_IMPORT_ACCEPT : VAULT_IMPORT_ACCEPT + ',*/*'
              }
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </>
        )}

        {(uploaded.length > 0 || importCount > 0) && (
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="text-sm font-medium text-[var(--color-muted)]">
              {t('vault.remoteUploadSent')}
            </h2>
            {importCount > 0 && (
              <p className="mt-3 text-sm">
                {t('vault.aiImportMobileSent', { count: importCount })}
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {uploaded.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  <span className="truncate">{doc.title}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              {t('vault.remoteUploadMobileDone')}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
