import assert from 'node:assert/strict';
import { test } from 'node:test';
import en from '../data/en.json' with { type: 'json' };
import es from '../data/es.json' with { type: 'json' };
import ja from '../data/ja.json' with { type: 'json' };
import { getLocale, setLocale, t } from './index.ts';
import { languageOptions } from './locales.ts';

function flatten(tree: object, prefix = ''): Record<string, string> {
	return Object.fromEntries(Object.entries(tree).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return typeof value === 'string' ? [[path, value]] : Object.entries(flatten(value, path));
	}));
}

test('every supported language has complete non-empty translations and matching placeholders', () => {
	const reference = flatten(en);
	const placeholders = (message: string) => [...message.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort();
	for (const [locale, dictionary] of Object.entries({ en, es, ja })) {
		const translated = flatten(dictionary);
		assert.deepEqual(Object.keys(translated).sort(), Object.keys(reference).sort(), locale);
		for (const [key, message] of Object.entries(translated)) {
			assert.ok(message.trim(), `${locale}: ${key} is empty`);
			assert.deepEqual(placeholders(message), placeholders(reference[key]), `${locale}: ${key}`);
		}
	}
});

test('Japanese lookup interpolates names, numbers and widget announcements without changing user text', () => {
	try {
		setLocale('ja');
		assert.equal(getLocale(), 'ja');
		assert.equal(t('navigation.about'), '自己紹介');
		assert.equal(t('meta.homeTitle', { name: 'Guillermo' }), 'Guillermo | ポートフォリオ');
		assert.equal(t('lab.kanban.progressSummary', { done: 2, total: 3 }), '3件中2件完了');
		assert.equal(t('lab.conway.cellLabel', { row: 2, column: 5 }), '2行5列');
		assert.equal(t('lab.kanban.announcements.added', { title: 'テスト {{title}}', status: '未着手' }), '「テスト {{title}}」を「未着手」に追加しました。');
		assert.equal(t('clock.analogLabel'), '{{location}}の時刻を示すアナログ時計');
		assert.throws(() => t('missing.translation'), /Missing string translation/);
	} finally { setLocale('en'); }
});

test('language changes select their own dictionary and restore English correctly', () => {
	try {
		for (const { value } of languageOptions) {
			setLocale(value);
			assert.equal(t('navigation.about'), { en, es, ja }[value].navigation.about);
		}
		setLocale('en');
		assert.equal(t('navigation.about'), 'About');
	} finally { setLocale('en'); }
});
