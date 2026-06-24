'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileUploadPage } from '@/components/vault/mobile-upload-page';
import { t } from '@/lib/i18n';

function MobileUploadContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-[var(--color-muted)]">
        {t('vault.remoteUploadInvalidLink')}
      </div>
    );
  }

  return <MobileUploadPage token={token} />;
}

export default function MobileUploadRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-[var(--color-muted)]">
          {t('common.loading')}
        </div>
      }
    >
      <MobileUploadContent />
    </Suspense>
  );
}
