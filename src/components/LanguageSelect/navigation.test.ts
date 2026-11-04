import assert from 'node:assert/strict';
import { test } from 'node:test';
import { languageNavigationTarget, localeHref, normalizeLocale } from './navigation.ts';

test('normalizes unsupported locales to english', () => {
	assert.equal(normalizeLocale('en'), 'en');
	assert.equal(normalizeLocale('es'), 'es');
	assert.equal(normalizeLocale('ja'), 'ja');
	assert.equal(normalizeLocale('jp'), 'en');
	assert.equal(normalizeLocale('fr'), 'en');
});

test('maps locale to route href', () => {
	assert.equal(localeHref('en'), '/');
	assert.equal(localeHref('es'), '/es/');
	assert.equal(localeHref('ja'), '/ja/');
});

test('builds language navigation target preserving hash', () => {
	assert.equal(languageNavigationTarget('en'), '/');
	assert.equal(languageNavigationTarget('es'), '/es/');
	assert.equal(languageNavigationTarget('ja'), '/ja/');
	assert.equal(languageNavigationTarget('en', '#skills'), '/#skills');
	assert.equal(languageNavigationTarget('es', '#contact'), '/es/#contact');
	assert.equal(languageNavigationTarget('ja', '#projects'), '/ja/#projects');
	assert.equal(languageNavigationTarget('ja', '#skills'), '/ja/#skills');
	assert.equal(languageNavigationTarget('unknown', '#projects'), '/#projects');
});
