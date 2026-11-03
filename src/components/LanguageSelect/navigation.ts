import type { Locale } from '../../i18n';

export const normalizeLocale = (locale: string): Locale =>
	locale === 'es' ? 'es' : 'en';

export const localeHref = (locale: Locale): string =>
	locale === 'es' ? '/es/' : '/';

export const languageNavigationTarget = (locale: string, hash = ''): string =>
	`${localeHref(normalizeLocale(locale))}${hash || ''}`;
