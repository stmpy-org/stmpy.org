/**
 * Regenerate public brand / favicon / OG assets from the source chip+Python logo.
 * Usage: node scripts/generate-brand-assets.mjs [path/to/stmpy-logo.png]
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SRC =
	process.argv[2] ||
	path.join(
		process.env.HOME || '',
		'Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-cee0fce5-8080-4623-bf28-e7e22d2f4ae9/files/internal/assets/stmpy-logo.png',
	);

function pngToIco(pngBuffers) {
	const count = pngBuffers.length;
	const headerSize = 6 + count * 16;
	let offset = headerSize;
	const entries = [];
	for (const png of pngBuffers) {
		const width = (png[16] << 24) | (png[17] << 16) | (png[18] << 8) | png[19];
		const height = (png[20] << 24) | (png[21] << 16) | (png[22] << 8) | png[23];
		entries.push({
			wByte: width >= 256 ? 0 : width,
			hByte: height >= 256 ? 0 : height,
			size: png.length,
			offset,
			png,
		});
		offset += png.length;
	}
	const buf = Buffer.alloc(offset);
	buf.writeUInt16LE(0, 0);
	buf.writeUInt16LE(1, 2);
	buf.writeUInt16LE(count, 4);
	let eOff = 6;
	for (const e of entries) {
		buf[eOff] = e.wByte;
		buf[eOff + 1] = e.hByte;
		buf[eOff + 2] = 0;
		buf[eOff + 3] = 0;
		buf.writeUInt16LE(1, eOff + 4);
		buf.writeUInt16LE(32, eOff + 6);
		buf.writeUInt32LE(e.size, eOff + 8);
		buf.writeUInt32LE(e.offset, eOff + 12);
		eOff += 16;
	}
	for (const e of entries) e.png.copy(buf, e.offset);
	return buf;
}

async function contentBBox(src) {
	const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const w = info.width;
	const h = info.height;
	const ch = info.channels;
	let minX = w;
	let minY = h;
	let maxX = 0;
	let maxY = 0;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (data[(y * w + x) * ch + 3] > 8) {
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
		}
	}
	const pad = 12;
	const left = Math.max(0, minX - pad);
	const top = Math.max(0, minY - pad);
	const right = Math.min(w - 1, maxX + pad);
	const bottom = Math.min(h - 1, maxY + pad);
	return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function main() {
	if (!fs.existsSync(SRC)) {
		console.error('Source logo not found:', SRC);
		process.exit(1);
	}
	const brandDir = path.join(root, 'public/brand');
	fs.mkdirSync(brandDir, { recursive: true });
	const box = await contentBBox(SRC);
	// Working master stays in memory only — ship small sizes, not the ~800KB source.
	const masterBuf = await sharp(SRC)
		.extract(box)
		.resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png({ compressionLevel: 9 })
		.toBuffer();

	async function sizePng(size, dest) {
		const buf = await sharp(masterBuf)
			.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.png({ compressionLevel: 9 })
			.toBuffer();
		await fs.promises.writeFile(dest, buf);
		return buf;
	}

	await sizePng(128, path.join(brandDir, 'logo.png'));
	await sizePng(64, path.join(brandDir, 'logo-64.png'));
	const fav32 = await sizePng(32, path.join(root, 'public/favicon-32.png'));
	const fav16 = await sizePng(16, path.join(root, 'public/favicon-16.png'));
	await sizePng(180, path.join(root, 'public/apple-touch-icon.png'));

	const ogLogo = await sharp(masterBuf)
		.resize(420, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toBuffer();
	const og = await sharp({
		create: { width: 1200, height: 630, channels: 3, background: { r: 11, g: 11, b: 11 } },
	})
		.composite([{ input: ogLogo, gravity: 'centre' }])
		.png({ compressionLevel: 9 })
		.toBuffer();
	await fs.promises.writeFile(path.join(root, 'public/og-image.png'), og);

	await fs.promises.writeFile(path.join(root, 'public/favicon.ico'), pngToIco([fav16, fav32]));

	const fav64 = await sizePng(64, path.join(brandDir, 'logo-64.png'));
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <image href="data:image/png;base64,${fav64.toString('base64')}" width="64" height="64"/>
</svg>
`;
	await fs.promises.writeFile(path.join(root, 'public/favicon.svg'), svg);
	console.log('Wrote brand + favicon + OG assets from', SRC);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
