#!/usr/bin/env node
/**
 * export_deck_stage_pdf.mjs — PDF export for the single-file <deck-stage> architecture
 *
 * Usage:
 *   node export_deck_stage_pdf.mjs --html <deck.html> --out <file.pdf> [--width 1920] [--height 1080]
 *
 * When to use this script?
 *   - your deck is a **single HTML file**, every slide is a `<section>`, and the outer wrapper is `<deck-stage>`
 *   - in that case `export_deck_pdf.mjs` (multi-file only) does not apply
 *
 * Why you cannot just call `page.pdf()` (pitfall log, 2026-04-20):
 *   1. deck-stage's shadow CSS `::slotted(section) { display: none }` leaves only the active slide visible
 *   2. in print media an outer `!important` cannot beat the shadow DOM rule
 *   3. result: the PDF always has exactly 1 page (the active one)
 *
 * Fix:
 *   after opening the HTML, use page.evaluate to pull every section out of the deck-stage slot,
 *   append them to a plain div under body with inline styles forcing position:relative + fixed size,
 *   give each section page-break-after: always, and set the last one to auto to avoid a trailing blank page.
 *
 * Dependencies: playwright
 *   npm install playwright
 *
 * Output:
 *   - text stays vector (copyable, searchable)
 *   - 1:1 visual fidelity
 *   - fonts must be loadable by Chromium (local fonts or Google Fonts)
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

function parseArgs() {
  const args = { width: 1920, height: 1080 };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    const k = a[i].replace(/^--/, '');
    args[k] = a[i + 1];
  }
  if (!args.html || !args.out) {
    console.error('usage: node export_deck_stage_pdf.mjs --html <deck.html> --out <file.pdf> [--width 1920] [--height 1080]');
    process.exit(1);
  }
  args.width = parseInt(args.width);
  args.height = parseInt(args.height);
  return args;
}

async function main() {
  const { html, out, width, height } = parseArgs();
  const htmlAbs = path.resolve(html);
  const outFile = path.resolve(out);

  await fs.access(htmlAbs).catch(() => {
    console.error(`HTML file not found: ${htmlAbs}`);
    process.exit(1);
  });

  console.log(`Rendering ${path.basename(htmlAbs)} → ${path.basename(outFile)}`);

  const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' })).catch(() => chromium.launch({ channel: 'msedge' }));  // borrow the user's installed Chrome / Edge when the Playwright browser is not downloaded
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  await page.goto('file://' + htmlAbs, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);  // wait for Google Fonts + deck-stage init

  // the core fix: pull the sections out of the shadow DOM slot and flatten them
  const sectionCount = await page.evaluate(({ W, H }) => {
    const stage = document.querySelector('deck-stage');
    if (!stage) throw new Error('<deck-stage> not found — this script only works with the single-file deck-stage architecture');
    const sections = Array.from(stage.querySelectorAll(':scope > section'));
    if (!sections.length) throw new Error('No <section> found inside <deck-stage>');

    // inject print styles
    const style = document.createElement('style');
    style.textContent = `
      @page { size: ${W}px ${H}px; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff; }
      deck-stage { display: none !important; }
    `;
    document.head.appendChild(style);

    // flatten under body
    const container = document.createElement('div');
    container.id = 'print-container';
    sections.forEach(s => {
      // inline style wins specificity; position:relative keeps absolute children anchored correctly
      s.style.cssText = `
        width: ${W}px !important;
        height: ${H}px !important;
        display: block !important;
        position: relative !important;
        overflow: hidden !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
      container.appendChild(s);
    });
    // no page break after the last page, to avoid a trailing blank page
    const last = sections[sections.length - 1];
    last.style.pageBreakAfter = 'auto';
    last.style.breakAfter = 'auto';
    document.body.appendChild(container);
    return sections.length;
  }, { W: width, H: height });

  await page.waitForTimeout(800);

  await page.pdf({
    path: outFile,
    width: `${width}px`,
    height: `${height}px`,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  const stat = await fs.stat(outFile);
  const kb = (stat.size / 1024).toFixed(0);
  console.log(`\n✓ Wrote ${outFile}  (${kb} KB, ${sectionCount} pages, vector)`);
  console.log(`  verify page count: mdimport "${outFile}" && pdfinfo "${outFile}" | grep Pages`);
}

main().catch(e => { console.error(e); process.exit(1); });
