import en from '../data/en.json' with { type: 'json' };
import es from '../data/es.json' with { type: 'json' };
import ja from '../data/ja.json' with { type: 'json' };
import type { Locale } from './locales.ts';
export type { Locale } from './locales.ts';

type InterpolationValues = Record<string, string | number>;
type MessageTree = Record<string, unknown>;

const dictionaries = { en, es, ja } as const;
let activeLocale: Locale = 'en';

export const setLocale = (locale: Locale) => {
	activeLocale = locale;
};

export const getLocale = () => activeLocale;

const getMessageFromDictionary = (
	messages: MessageTree,
	key: string,
): unknown =>
	key.split('.').reduce<unknown>((current, part) => {
		if (current && typeof current === 'object' && part in current) {
			return (current as MessageTree)[part];
		}

		return undefined;
	}, messages);

const getMessage = (key: string): string => {
	const localized = getMessageFromDictionary(dictionaries[activeLocale], key);
	if (typeof localized === 'string') return localized;

	const fallback = getMessageFromDictionary(dictionaries.en, key);
	if (typeof fallback === 'string') return fallback;

	throw new Error(`Missing string translation for "${key}".`);
};

export const t = (key: string, values: InterpolationValues = {}): string =>
	getMessage(key).replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
		String(values[name] ?? `{{${name}}}`),
	);
