// Opens the temple page in headless Chromium (software WebGL via SwiftShader).
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

export async function openTemple({ width = 1280, height = 720, params = {} } = {}) {
  const server = await startServer(0);
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  const q = new URLSearchParams({ w: String(width), h: String(height), ...params });
  page.setDefaultTimeout(600_000);
  await page.goto(`${server.url}/index.html?${q}`, { timeout: 600_000 });
  try {
    await page.waitForFunction(() => window.__temple?.ready === true, null, { timeout: 600_000, polling: 250 });
  } catch (e) {
    throw new Error(`page did not become ready:\n${errors.join('\n')}\n${e}`);
  }
  return {
    page, errors,
    async close() { await browser.close(); server.close(); },
  };
}
