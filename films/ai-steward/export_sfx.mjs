import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({
  ...(process.env.HYPERFRAMES_BROWSER_PATH ? { executablePath: process.env.HYPERFRAMES_BROWSER_PATH } : {}),
  args: ['--no-sandbox'],
});
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/film/index.html', { waitUntil: 'load', timeout: 60000 });

const sfx = await p.evaluate(() => window.__SFX);
fs.writeFileSync('out/sfx.json', JSON.stringify(sfx));
console.log('sfx events', sfx.length, Object.entries(sfx.reduce((a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a), {})).join(' '));
await b.close();
