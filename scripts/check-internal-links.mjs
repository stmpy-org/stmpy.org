#!/usr/bin/env node
/**
 * Cheap internal-link check over dist/ HTML after `astro build`.
 * Flags hrefs that stay on-site but do not resolve to a built file.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
	console.error('dist/ missing — run npm run build first');
	process.exit(1);
}

function walkHtml(dir) {
	/** @type {string[]} */
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...walkHtml(p));
		else if (name.endsWith('.html')) out.push(p);
	}
	return out;
}

/** @param {string} href @param {string} fromFile */
function resolveTarget(href, fromFile) {
	if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
		return null;
	}
	if (/^[a-z]+:/i.test(href)) return null; // absolute external
	const bare = href.split('#')[0].split('?')[0];
	if (!bare) return null;

	let path = bare;
	if (bare.startsWith('/')) path = join(dist, bare);
	else path = join(dirname(fromFile), bare);
	path = normalize(path);

	const candidates = [
		path,
		path.endsWith('.html') ? null : `${path}.html`,
		path.endsWith('/') ? join(path, 'index.html') : join(path, 'index.html'),
	].filter(Boolean);

	return candidates;
}

const pages = walkHtml(dist);
/** @type {{ file: string, href: string }[]} */
const broken = [];

for (const file of pages) {
	const html = readFileSync(file, 'utf8');
	const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map((m) => m[1]);
	for (const href of hrefs) {
		const candidates = resolveTarget(href, file);
		if (!candidates) continue;
		if (!candidates.some((c) => existsSync(c))) {
			broken.push({ file: file.slice(dist.length), href });
		}
	}
}

if (broken.length) {
	console.error(`broken internal links: ${broken.length}`);
	for (const b of broken.slice(0, 50)) {
		console.error(`  ${b.file} -> ${b.href}`);
	}
	if (broken.length > 50) console.error(`  … and ${broken.length - 50} more`);
	process.exit(1);
}

console.log(`ok: checked ${pages.length} HTML files, no broken internal links`);
