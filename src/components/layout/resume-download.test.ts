import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('resume download path targets public pdf', () => {
	const contentFile = readFileSync(new URL('../../data/content.ts', import.meta.url), 'utf8');
	const match = contentFile.match(/resumePath\s*=\s*'([^']+)'/);
	assert.ok(match?.[1], 'resumePath constant should be defined in src/data/content.ts');
	assert.equal(match[1], '/resume/guillermo-cardona-resume.pdf');
	assert.match(match[1], /^\/resume\/.+\.pdf$/);
});

test('header and hero expose resumePath download links', () => {
	const header = readFileSync(new URL('./Header.astro', import.meta.url), 'utf8');
	const hero = readFileSync(new URL('../sections/Hero.astro', import.meta.url), 'utf8');
	const pattern = /href=\{resumePath\}\s+download/;

	assert.match(header, pattern);
	assert.match(hero, pattern);
});
