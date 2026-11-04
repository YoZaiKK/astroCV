export type Theme = 'light' | 'dark';
export type ThemeMode = Theme | 'system';

/** Self-contained so the same resolver can run inline before the first paint. */
export function resolveTheme(preference: unknown, systemDark: boolean): { mode: ThemeMode; theme: Theme } {
	const mode = preference === 'dark' || preference === 'system' ? preference : 'light';
	return { mode, theme: mode === 'system' ? (systemDark ? 'dark' : 'light') : mode };
}

export function toggleTheme(current: Theme) {
	return resolveTheme(current === 'dark' ? 'light' : 'dark', false);
}

export const themeBootstrap = `(() => {
	const resolve = ${resolveTheme.toString()};
	let preference;
	try { preference = localStorage.getItem('theme'); } catch {}
	const state = resolve(preference, window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.dataset.theme = state.theme;
	document.documentElement.dataset.themeMode = state.mode;
})();`;
