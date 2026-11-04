export const languageOptions = [
	{ value: 'en', label: 'English', href: '/' },
	{ value: 'es', label: 'Español', href: '/es/' },
	{ value: 'ja', label: '日本語', href: '/ja/' },
] as const;

export type Locale = typeof languageOptions[number]['value'];
