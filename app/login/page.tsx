'use client';

import { useMutation } from '@tanstack/react-query';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { resolveUserError, type UserFacingError } from '@/lib/errors';
import { t } from '@/lib/i18n';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<UserFacingError | null>(null);

  const completeAuth = (accessToken: string) => {
    setToken(accessToken);
    router.push('/vault');
  };

  const handleAuthError = (e: unknown) => {
    setError(resolveUserError(e, 'auth'));
  };

  const auth = useMutation({
    mutationFn: async () => {
      if (mode === 'login') return api.login(username, password);
      return api.register(username, email, password);
    },
    onSuccess: (data) => completeAuth(data.accessToken),
    onError: handleAuthError,
  });

  const googleAuth = useMutation({
    mutationFn: (idToken: string) => api.loginWithGoogle(idToken),
    onSuccess: (data) => completeAuth(data.accessToken),
    onError: handleAuthError,
  });

  const clearError = () => setError(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-canvas)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.06)]"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Lock size={20} />
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl">Vault</p>
            <p className="text-sm text-[var(--color-muted)]">{t('auth.tagline')}</p>
          </div>
        </div>

        <div className="mb-6 flex rounded-xl bg-[var(--color-surface-2)] p-1">
          {(['login', 'register'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                clearError();
              }}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm transition',
                mode === item
                  ? 'bg-[var(--color-surface)] shadow-sm'
                  : 'text-[var(--color-muted)]',
              )}
            >
              {item === 'login' ? t('auth.signIn') : t('auth.signUp')}
            </button>
          ))}
        </div>

        {googleClientId ? (
          <div className="mb-6 space-y-4">
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <p className="mb-3 text-center text-xs text-[var(--color-muted)]">
                {t('auth.continueWithGoogle')}
              </p>
              <div className="flex justify-center [&>div]:!w-full [&_iframe]:!w-full">
                <GoogleLogin
                  onSuccess={(response) => {
                    clearError();
                    if (!response.credential) {
                      setError({
                        title: t('auth.errors.googleTitle'),
                        message: t('auth.googleNoToken'),
                        variant: 'error',
                      });
                      return;
                    }
                    googleAuth.mutate(response.credential);
                  }}
                  onError={() =>
                    setError({
                      title: t('auth.errors.googleTitle'),
                      message: t('auth.googleFailed'),
                      variant: 'error',
                    })
                  }
                  theme="outline"
                  size="large"
                  width="360"
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              {t('common.or')}
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            clearError();
            auth.mutate();
          }}
        >
          <input
            className={cn(
              'w-full rounded-xl border bg-transparent px-4 py-3 outline-none transition',
              error
                ? 'border-red-300 focus:border-red-400'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) clearError();
            }}
            autoComplete="username"
            required
          />
          {mode === 'register' && (
            <input
              className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--color-accent)]"
              placeholder={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          )}
          <input
            className={cn(
              'w-full rounded-xl border bg-transparent px-4 py-3 outline-none transition',
              error
                ? 'border-red-300 focus:border-red-400'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            placeholder={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          <AnimatePresence mode="wait">
            {error && (
              <Alert
                key={`${error.title}-${error.message}`}
                title={error.title}
                message={error.message}
                variant={error.variant}
              />
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={auth.isPending || googleAuth.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {auth.isPending
              ? t('auth.pleaseWait')
              : mode === 'login'
                ? t('auth.signIn')
                : t('auth.createAccount')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          <Link href="/" className="underline-offset-4 hover:underline">
            {t('common.backToHome')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  if (!googleClientId) {
    return <LoginForm />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}
