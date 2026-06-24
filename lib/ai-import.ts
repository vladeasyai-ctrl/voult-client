import { t } from '@/lib/i18n';
import {
  isVaultImportFile,
  VAULT_IMPORT_ACCEPT,
} from '@/lib/vault-import-files';

/** @deprecated Use isVaultImportFile */
export const isAiImportFile = isVaultImportFile;

export const AI_IMPORT_ACCEPT = VAULT_IMPORT_ACCEPT;

export const AI_IMPORT_UNSUPPORTED_HINT = t('vault.aiImportSupported');
