// Renders preview.html at fixed timeline moments → PNG frames + a contact sheet.
// Usage: node capture.mjs <outDir> [t1,t2,...]
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

// Resolve playwright from a local install first, then from NODE_PATH (globally installed copy).
const chromium = await (async () => {
  try { return (await import('playwright')).chromium; } catch (_) {}
  for (const dir of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) {
    try { return createRequire(path.join(dir, '/'))('playwright').chromium; } catch (_) {}
  }
  throw new Error('playwright not found: npm i -D playwright, or set NODE_PATH to a node_modules that has it');
})();

const here = path.dirname(fileURLToPath(import.meta.url));
const preview = path.resolve(here, '..', 'tippo-referral-tiers-animation', 'preview.html');
const outDir = path.resolve(process.argv[2] || path.join(here, 'frames'));
const times = (process.argv[3] || '0.3,0.9,1.5,2.1,2.7,3.3,3.9,4.5,5.1,5.7').split(',').map(Number);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 2 });
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
await page.goto('file://' + preview);
await page.waitForTimeout(300);

const shots = [];
for (const t of times) {
  await page.evaluate(t => window.__seek(t), t);
  await page.waitForTimeout(50);
  const d = await page.locator('#desktop').screenshot();
  const m = await page.locator('#mobile').screenshot();
  const fd = path.join(outDir, `desktop-${t.toFixed(2)}s.png`);
  const fm = path.join(outDir, `mobile-${t.toFixed(2)}s.png`);
  fs.writeFileSync(fd, d); fs.writeFileSync(fm, m);
  shots.push({ t, fd, fm });
}

// contact sheet (desktop + mobile per row) rendered in the same browser
const sheet = await browser.newPage({ viewport: { width: 1400, height: 200 + times.length * 260 }, deviceScaleFactor: 1 });
const uri = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const rows = shots.map(s => `<div class="row"><div class="t">${s.t.toFixed(2)} s</div><img src="${uri(s.fd)}"><img class="m" src="${uri(s.fm)}"></div>`).join('');
await sheet.setContent(`<style>
  body{margin:0;background:#F6F7F6;font:13px Inter,system-ui,sans-serif;color:#020408}
  .row{display:flex;align-items:center;gap:24px;padding:14px 20px;border-bottom:1px solid #e6e8e6}
  .t{width:60px;color:#8C8F93}
  img{height:210px;background:#fff;border-radius:16px;padding:8px}
  img.m{height:92px}
</style>${rows}`);
await sheet.waitForTimeout(200);
await sheet.screenshot({ path: path.join(outDir, 'contact-sheet.png'), fullPage: true });
await browser.close();
console.log('frames →', outDir);
