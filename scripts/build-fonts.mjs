/**
 * Regenerates the self-hosted Lexend subsets in `src/assets/fonts/`.
 *
 * Not part of `npm run build` — the .woff2 files are committed, so this only
 * needs re-running when the source font or the ranges below change:
 *
 *   npm i --no-save subset-font
 *   node scripts/build-fonts.mjs [path/to/Lexend-VariableFont_wght.ttf]
 *
 * Two things keep the payload small, and both have a cost worth knowing about:
 *
 * 1. The weight axis is clipped to 400..700 (`WEIGHT_RANGE`). That is the full
 *    range the design system declares in `src/styles/theme/default.css`, and it
 *    roughly halves the file. Anything outside it clamps to the nearest end, so
 *    widen this — and the `font-weight` descriptor in `src/styles/fonts.css` —
 *    before introducing a lighter or heavier style.
 *
 * 2. The glyphs are split across the same unicode ranges Google Fonts serves
 *    Lexend on, so an English page fetches `latin` alone and nothing else. The
 *    ranges here and the `unicode-range` descriptors in `fonts.css` must stay
 *    in sync; they are copied from the Google Fonts CSS2 response.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const WEIGHT_RANGE = { min: 400, max: 700 };

const SUBSETS = {
	latin:
		'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
	'latin-ext':
		'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
	vietnamese:
		'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
};

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const source = process.argv[2] ?? path.join(root, '..', 'Lexend', 'Lexend-VariableFont_wght.ttf');
const outDir = path.join(root, 'src', 'assets', 'fonts');

/** Codepoints the font actually draws — subsetting to more than this is wasted bytes. */
function readCodepoints(buf) {
	const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	let cmap = 0;
	for (let i = 0; i < dv.getUint16(4); i++) {
		const o = 12 + i * 16;
		const tag = String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
		if (tag === 'cmap') cmap = dv.getUint32(o + 8);
	}
	let sub = 0;
	for (let i = 0; i < dv.getUint16(cmap + 2); i++) {
		const o = cmap + 4 + i * 8;
		const [pid, eid, off] = [dv.getUint16(o), dv.getUint16(o + 2), dv.getUint32(o + 4)];
		const format = dv.getUint16(cmap + off);
		if (pid === 3 && (eid === 1 || eid === 10) && (format === 4 || format === 12)) sub = cmap + off;
	}

	const out = new Set();
	const format = dv.getUint16(sub);
	if (format === 4) {
		const segX2 = dv.getUint16(sub + 6);
		const endO = sub + 14;
		const startO = endO + segX2 + 2;
		for (let i = 0; i < segX2 / 2; i++) {
			const start = dv.getUint16(startO + i * 2);
			if (start === 0xffff) continue;
			for (let c = start; c <= dv.getUint16(endO + i * 2); c++) out.add(c);
		}
	} else if (format === 12) {
		for (let i = 0; i < dv.getUint32(sub + 12); i++) {
			const o = sub + 16 + i * 12;
			for (let c = dv.getUint32(o); c <= dv.getUint32(o + 4); c++) out.add(c);
		}
	}
	return out;
}

function expand(spec) {
	const out = new Set();
	for (const part of spec.split(',')) {
		const range = part.trim().replace(/^U\+/i, '');
		if (!range.includes('-')) {
			out.add(parseInt(range, 16));
			continue;
		}
		const [from, to] = range.split('-').map((hex) => parseInt(hex, 16));
		for (let c = from; c <= to; c++) out.add(c);
	}
	return out;
}

const ttf = fs.readFileSync(source);
const available = readCodepoints(ttf);
fs.mkdirSync(outDir, { recursive: true });

for (const [name, spec] of Object.entries(SUBSETS)) {
	const codepoints = [...expand(spec)].filter((c) => available.has(c));
	if (codepoints.length === 0) continue;

	const woff2 = await subsetFont(ttf, codepoints.map((c) => String.fromCodePoint(c)).join(''), {
		targetFormat: 'woff2',
		variationAxes: { wght: WEIGHT_RANGE },
	});
	fs.writeFileSync(path.join(outDir, `lexend-${name}.woff2`), woff2);
	console.log(`lexend-${name}.woff2  ${codepoints.length} glyphs  ${(woff2.length / 1024).toFixed(1)} KB`);
}
