import messages from '../data/en.json';

type InterpolationValues = Record<string, string | number>;
type MessageTree = Record<string, unknown>;

const getMessage = (key: string): string => {
	const value = key.split('.').reduce<unknown>((current, part) => {
		if (current && typeof current === 'object' && part in current) {
			return (current as MessageTree)[part];
		}

		return undefined;
	}, messages);

	if (typeof value !== 'string') {
		throw new Error(`Missing string translation for "${key}".`);
	}

	return value;
};

export const t = (key: string, values: InterpolationValues = {}): string =>
	getMessage(key).replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
		String(values[name] ?? `{{${name}}}`),
	);
