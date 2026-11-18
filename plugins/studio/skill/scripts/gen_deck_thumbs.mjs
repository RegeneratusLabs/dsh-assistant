#!/usr/bin/env node
/**
 * gen_deck_thumbs.mjs — build a thumbnail per page of a multi-file deck (for the "infinite gallery" overview in deck_index.html).
 *
 * Background: deck_index.html has two overviews —
 *   · grid (default, 60%): renders the real sub-pages in iframes, sharp and WYSIWYG, no thumbnails needed.
 *   · infinite gallery (40%): tiles every page seamlessly and endlessly with a slow drift; with dozens to hundreds of tiles, all-iframes would be janky,
 *     so the gallery uses <img> thumbnails — one image reused many times is decoded by the browser only once, so it stays smooth.
 *   This script prepares that batch of thumbnails for the gallery. Grid mode does not need it.
 *
 * Usage (copy into the deck project root, install deps, then run):
 *   npm install playwright sharp     (sharp optional: without it the browser screenshots JPEGs at thumbnail size)
 *   node gen_deck_thumbs.mjs --slides slides --out thumbs [--width 1600] [--quality 86]
 *
 * Then add thumb to each MANIFEST entry in index.html (a .jpg with the same name as file):
 *   { file: "slides/01-cover.html", thumb: "thumbs/01-cover.jpg", label: "Cover" }
 * deck_index.html only uses thumb in gallery mode; grid mode always uses file (iframe). Without thumb the gallery falls back to iframe.
 *
 * Tip: do not make thumbnails too low-resolution (default 1600px), or cards look soft when hovered in the gallery.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const slidesDir = arg('slides', 'slides');
const outDir = arg('out', 'thumbs');
const width = parseInt(arg('width', '1600'), 10);
const quality = parseInt(arg('quality', '86'), 10);
const W = parseInt(arg('canvas-w', '1920'), 10);
const H = parseInt(arg('canvas-h', '1080'), 10);

if (!fs.existsSync(slidesDir)) { console.error('slides directory not found: ' + slidesDir); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(slidesDir).filter(f => f.endsWith('.html')).sort();
if (!files.length) { console.error('no .html files in the slides directory'); process.exit(1); }

const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' })).catch(() => chromium.launch({ channel: 'msedge' }));  // borrow the user's installed Chrome / Edge when the Playwright browser is not downloaded
const sharp = await import('sharp').then(m => m.default).catch(() => null);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: sharp ? 1 : width / W });
let ok = 0;
for (const f of files) {
  const base = f.replace(/\.html$/, '');
  const out = path.join(outDir, base + '.jpg');
  try {
    await page.goto('file://' + path.resolve(slidesDir, f), { waitUntil: 'load' });
    await page.waitForTimeout(2800);                 // wait for webfont / image paint
    if (sharp) {
      const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
      await sharp(buf).resize(width).jpeg({ quality }).toFile(out);
    } else {
      await page.screenshot({ path: out, type: 'jpeg', quality, clip: { x: 0, y: 0, width: W, height: H } });
    }
    ok++; console.log('[ok] ' + out);
  } catch (e) { console.error('[FAIL] ' + f + ': ' + e.message); }
}
await browser.close();
console.log(`\n=== ${ok}/${files.length} thumbnails → ${outDir}/ ===`);
console.log('add thumb to each MANIFEST entry in index.html: "' + outDir + '/<same-name>.jpg" (gallery mode only)');
