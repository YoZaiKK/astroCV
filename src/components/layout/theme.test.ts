import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { resolveTheme, themeBootstrap, toggleTheme } from './theme.ts';

test('first visit and invalid preferences use light even on a dark operating system', () => {
	for (const preference of [null, undefined, '', 'invalid', 'DARK']) {
		assert.deepEqual(resolveTheme(preference, true), { mode: 'light', theme: 'light' });
	}
});

test('saved manual preferences take precedence over the operating system', () => {
	assert.deepEqual(resolveTheme('light', true), { mode: 'light', theme: 'light' });
	assert.deepEqual(resolveTheme('dark', false), { mode: 'dark', theme: 'dark' });
});

test('Auto follows the operating system and the switch always produces a manual choice', () => {
	for (const systemDark of [false, true]) {
		const automatic = resolveTheme('system', systemDark);
		assert.equal(automatic.theme, systemDark ? 'dark' : 'light');
		const manual = toggleTheme(automatic.theme);
		assert.equal(manual.mode, systemDark ? 'light' : 'dark');
		assert.deepEqual(resolveTheme(manual.mode, !systemDark), manual);
	}
});

test('the actual inline bootstrap resolves all preferences before paint, including blocked storage', () => {
	for (const preference of [null, 'light', 'dark', 'system', 'invalid']) {
		for (const systemDark of [false, true]) {
			const dataset: Record<string, string> = {};
			runInNewContext(themeBootstrap, {
				localStorage: { getItem: () => preference },
				window: { matchMedia: () => ({ matches: systemDark }) },
				document: { documentElement: { dataset } },
			});
			const state = resolveTheme(preference, systemDark);
			assert.deepEqual(dataset, { theme: state.theme, themeMode: state.mode });
		}
	}
	const dataset: Record<string, string> = {};
	runInNewContext(themeBootstrap, {
		get localStorage() { throw new Error('Storage blocked'); },
		window: { matchMedia: () => ({ matches: true }) },
		document: { documentElement: { dataset } },
	});
	assert.deepEqual(dataset, { theme: 'light', themeMode: 'light' });
});
