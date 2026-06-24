import { en, type Messages } from './en';

const catalogs: Record<string, Messages> = { en };

const DEFAULT_LOCALE = 'en';

function getNestedValue(obj: unknown, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;

  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }

  const pluralMatch = result.match(/\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/);
  if (pluralMatch) {
    const [, key, one, other] = pluralMatch;
    const count = Number(params[key]);
    const chosen = count === 1 ? one : other;
    result = result.replace(pluralMatch[0], chosen.replace('#', String(count)));
  }

  return result;
}

export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: string = DEFAULT_LOCALE,
): string {
  const catalog = catalogs[locale] ?? en;
  const value = getNestedValue(catalog, key);
  if (!value) return key;
  return interpolate(value, params);
}

export function getLocale(): string {
  return DEFAULT_LOCALE;
}
