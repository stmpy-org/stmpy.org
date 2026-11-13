#!/usr/bin/env node
/**
 * Sync tutorials from a local stmpy git checkout at a specific tag.
 *
 * Usage:
 *   npm run sync-docs -- --tag v0.0.2 --from ../stmpy
 *
 * Reads the tagged tree via `git archive` (not the working tree), writes:
 *   - vendor/stmpy-docs/<tag>/          raw docs/ from that tag
 *   - src/content/docs/tutorials/       EN Starlight pages
 *   - src/content/docs/zh-cn/tutorials/ ZH Starlight pages
 *   - docs-source.lock.json
 */

import { spawnSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
	const out = { tag: null, from: null };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--tag') out.tag = argv[++i];
		else if (a === '--from') out.from = argv[++i];
		else if (a === '--help' || a === '-h') out.help = true;
		else throw new Error(`unknown argument: ${a}`);
	}
	return out;
}

function run(cmd, args, opts = {}) {
	const res = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
	if (res.status !== 0) {
		const err = (res.stderr || res.stdout || '').trim();
		throw new Error(`${cmd} ${args.join(' ')} failed: ${err}`);
	}
	return res.stdout.trim();
}

function walkFiles(dir) {
	/** @type {string[]} */
	const files = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) files.push(...walkFiles(p));
		else files.push(p);
	}
	return files;
}

/**
 * Rewrite repo-style `foo.md` links to Starlight routes.
 * Non-index pages render as `slug/index.html`, so relative links need one extra `../`.
 */
function rewriteMarkdownLinks(body, { isIndex }) {
	return body.replace(/\]\(([^)\s#]+)\.md(#[^)]*)?\)/g, (_m, path, hash = '') => {
		let target = `${path}/`;
		const absolute = target.startsWith('/') || /^[a-z]+:/i.test(path);
		if (!isIndex && !absolute) target = `../${target}`;
		return `](${target}${hash || ''})`;
	});
}

/** Transform stmpy front matter `order` into Starlight `sidebar.order`. */
function transformMarkdown(source, filePath) {
	const isIndex = /(^|\/)index\.mdx?$/.test(filePath.replace(/\\/g, '/'));
	const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!fm) return rewriteMarkdownLinks(source, { isIndex });
	const body = rewriteMarkdownLinks(source.slice(fm[0].length), { isIndex });
	const lines = fm[1].split(/\r?\n/);
	/** @type {string[]} */
	const kept = [];
	let order = null;
	for (const line of lines) {
		const m = line.match(/^order:\s*(\d+)\s*$/);
		if (m) {
			order = Number(m[1]);
			continue;
		}
		kept.push(line);
	}
	if (order !== null) {
		kept.push('sidebar:');
		kept.push(`  order: ${order}`);
	}
	return `---\n${kept.join('\n')}\n---\n${body.startsWith('\n') ? body : `\n${body}`}`;
}

function copyTransformed(srcDir, destDir) {
	rmSync(destDir, { recursive: true, force: true });
	mkdirSync(destDir, { recursive: true });
	for (const file of walkFiles(srcDir)) {
		const rel = relative(srcDir, file);
		const dest = join(destDir, rel);
		mkdirSync(dirname(dest), { recursive: true });
		if (file.endsWith('.md') || file.endsWith('.mdx')) {
			writeFileSync(dest, transformMarkdown(readFileSync(file, 'utf8'), rel));
		} else {
			cpSync(file, dest);
		}
	}
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || !args.tag || !args.from) {
		console.log(`Usage: npm run sync-docs -- --tag v0.0.2 --from ../stmpy`);
		process.exit(args.help ? 0 : 1);
	}

	const from = join(root, args.from);
	if (!existsSync(join(from, '.git'))) {
		throw new Error(`not a git repo: ${from}`);
	}

	const commit = run('git', ['-C', from, 'rev-parse', `${args.tag}^{commit}`]);
	console.log(`syncing stmpy ${args.tag} (${commit}) from ${from}`);

	const tmp = join(root, '.tmp-stmpy-docs');
	rmSync(tmp, { recursive: true, force: true });
	mkdirSync(tmp, { recursive: true });

	const archive = spawnSync('git', ['-C', from, 'archive', '--format=tar', args.tag, 'docs'], {
		encoding: 'buffer',
		maxBuffer: 64 * 1024 * 1024,
	});
	if (archive.status !== 0) {
		throw new Error(`git archive failed: ${archive.stderr?.toString() || 'unknown error'}`);
	}
	const tar = spawnSync('tar', ['-x', '-C', tmp], { input: archive.stdout });
	if (tar.status !== 0) {
		throw new Error(`tar extract failed: ${tar.stderr?.toString() || 'unknown error'}`);
	}

	const docsRoot = join(tmp, 'docs');
	if (!existsSync(docsRoot)) throw new Error('archive did not contain docs/');

	const vendorDir = join(root, 'vendor', 'stmpy-docs', args.tag);
	rmSync(vendorDir, { recursive: true, force: true });
	mkdirSync(dirname(vendorDir), { recursive: true });
	cpSync(docsRoot, vendorDir, { recursive: true });

	const enSrc = docsRoot;
	const zhSrc = join(docsRoot, 'zh-cn');
	// EN: everything under docs except zh-cn/
	const enTmp = join(tmp, 'en-only');
	rmSync(enTmp, { recursive: true, force: true });
	mkdirSync(enTmp, { recursive: true });
	for (const name of readdirSync(enSrc)) {
		if (name === 'zh-cn') continue;
		cpSync(join(enSrc, name), join(enTmp, name), { recursive: true });
	}

	copyTransformed(enTmp, join(root, 'src', 'content', 'docs', 'tutorials'));
	if (!existsSync(zhSrc)) throw new Error('missing docs/zh-cn in tagged tree');
	copyTransformed(zhSrc, join(root, 'src', 'content', 'docs', 'zh-cn', 'tutorials'));

	writeFileSync(
		join(root, 'docs-source.lock.json'),
		`${JSON.stringify(
			{
				stmpyTag: args.tag,
				commit,
				syncedAt: new Date().toISOString(),
				from: relative(root, from),
			},
			null,
			2,
		)}\n`,
	);

	rmSync(tmp, { recursive: true, force: true });
	console.log(`wrote vendor/stmpy-docs/${args.tag}/`);
	console.log('wrote src/content/docs/tutorials/ and src/content/docs/zh-cn/tutorials/');
	console.log('wrote docs-source.lock.json');
}

try {
	main();
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
}
