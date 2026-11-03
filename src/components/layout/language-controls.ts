import type { Locale } from '../../i18n';

export const normalizeLocale = (value: string): Locale =>
	value === 'es' ? 'es' : 'en';

export const localePath = (locale: Locale): string =>
	locale === 'es' ? '/es/' : '/';

export const languageTargetUrl = (nextLocale: string, hash = ''): string =>
	`${localePath(normalizeLocale(nextLocale))}${hash || ''}`;
