import assert from 'node:assert/strict';
import { test } from 'node:test';
import { languageNavigationTarget, localeHref, normalizeLocale } from './navigation.ts';

test('normalizes unsupported locales to english', () => {
	assert.equal(normalizeLocale('en'), 'en');
	assert.equal(normalizeLocale('es'), 'es');
	assert.equal(normalizeLocale('fr'), 'en');
});

test('maps locale to route href', () => {
	assert.equal(localeHref('en'), '/');
	assert.equal(localeHref('es'), '/es/');
});

test('builds language navigation target preserving hash', () => {
	assert.equal(languageNavigationTarget('en'), '/');
	assert.equal(languageNavigationTarget('es'), '/es/');
	assert.equal(languageNavigationTarget('en', '#skills'), '/#skills');
	assert.equal(languageNavigationTarget('es', '#contact'), '/es/#contact');
	assert.equal(languageNavigationTarget('unknown', '#projects'), '/#projects');
});
