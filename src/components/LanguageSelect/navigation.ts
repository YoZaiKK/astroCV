import { languageOptions, type Locale } from '../../i18n/locales.ts';

export const normalizeLocale = (locale: string): Locale =>
	languageOptions.find(option => option.value === locale)?.value ?? 'en';

export const localeHref = (locale: Locale): string =>
	languageOptions.find(option => option.value === locale)!.href;

export const languageNavigationTarget = (locale: string, hash = ''): string =>
	`${localeHref(normalizeLocale(locale))}${hash || ''}`;
