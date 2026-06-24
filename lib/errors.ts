import { ApiError } from './api';
import { t } from './i18n';

export type AlertVariant = 'error' | 'warning' | 'info';

export interface UserFacingError {
  title: string;
  message: string;
  variant: AlertVariant;
}

const WARNING_CODES = new Set([
  'USERNAME_EXISTS',
  'EMAIL_EXISTS',
  'NODE_HAS_CHILDREN',
  'INVALID_IMPORT_STATE',
  'AMBIGUOUS_FOLDER',
  'AMBIGUOUS_NODE',
]);

const AUTH_CODES = new Set([
  'UNAUTHORIZED',
  'INVALID_GOOGLE_TOKEN',
  'EMAIL_NOT_VERIFIED',
  'GOOGLE_AUTH_DISABLED',
  'USER_DISABLED',
]);

function titleForCode(code: string | undefined, status: number, context?: 'auth' | 'general'): string {
  if (code && AUTH_CODES.has(code)) {
    if (code === 'USERNAME_EXISTS' || code === 'EMAIL_EXISTS') {
      return t('auth.errors.accountExistsTitle');
    }
    if (code === 'USER_DISABLED') {
      return t('auth.errors.accountDisabledTitle');
    }
    if (code === 'INVALID_GOOGLE_TOKEN' || code === 'EMAIL_NOT_VERIFIED' || code === 'GOOGLE_AUTH_DISABLED') {
      return t('auth.errors.googleTitle');
    }
    return t('auth.errors.invalidCredentialsTitle');
  }

  if (context === 'auth' && status === 401) {
    return t('auth.errors.invalidCredentialsTitle');
  }

  if (status === 403) return t('auth.errors.unexpectedTitle');
  if (status === 404) return t('errors.generic');
  if (status >= 500) return t('auth.errors.unexpectedTitle');

  return t('auth.errors.unexpectedTitle');
}

function messageForApiError(error: ApiError): string {
  if (error.code) {
    const localized = t(`errors.codes.${error.code}`);
    if (localized !== `errors.codes.${error.code}`) {
      return localized;
    }
  }

  if (error.status === 401) {
    return t('auth.errors.invalidCredentialsMessage');
  }

  if (error.message && error.message !== 'Request failed') {
    return error.message;
  }

  return t('errors.generic');
}

function variantFor(error: ApiError): AlertVariant {
  if (error.code && WARNING_CODES.has(error.code)) return 'warning';
  if (error.status === 401 || error.status === 403) return 'error';
  if (error.status >= 500) return 'error';
  return 'error';
}

export function resolveUserError(error: unknown, context?: 'auth' | 'general'): UserFacingError {
  if (error instanceof ApiError) {
    return {
      title: titleForCode(error.code, error.status, context),
      message: messageForApiError(error),
      variant: variantFor(error),
    };
  }

  if (error instanceof TypeError) {
    return {
      title: t('auth.errors.networkTitle'),
      message: t('auth.errors.networkMessage'),
      variant: 'error',
    };
  }

  if (error instanceof Error && /failed to fetch|network/i.test(error.message)) {
    return {
      title: t('auth.errors.networkTitle'),
      message: t('auth.errors.networkMessage'),
      variant: 'error',
    };
  }

  return {
    title: t('auth.errors.unexpectedTitle'),
    message: error instanceof Error ? error.message : t('auth.errors.unexpectedMessage'),
    variant: 'error',
  };
}
