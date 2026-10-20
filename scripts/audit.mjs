import { connectBrowserForVerification, readLighthouseConnection } from './browser-session.mjs';
import { playAudit } from 'playwright-lighthouse';
import desktopConfig from 'lighthouse/core/config/lr-desktop-config.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const { hostname, port } = readLighthouseConnection();
const output = new URL('../.omo/evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await connectBrowserForVerification();
const context = await browser.newContext();
const page = await context.newPage();
const results = [];
try {
  for (const profile of ['desktop', 'mobile']) {
    for (let run = 1; run <= 3; run += 1) {
      await page.goto(origin);
      await page.locator('.getting-started').waitFor();
      const name = `lighthouse-${profile}-${run}`;
      await playAudit({
        page, port, ignoreError: true, disableLogs: true,
        opts: { hostname, disableStorageReset: true },
        thresholds: { performance: 100, accessibility: 100, 'best-practices': 100, seo: 100 },
        config: profile === 'desktop' ? desktopConfig : { extends: 'lighthouse:default' },
        reports: { formats: { json: true, html: true }, name, directory: output.pathname },
      });
      const report = JSON.parse(await readFile(new URL(`${name}.json`, output), 'utf8'));
      const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
      results.push({ profile, run, scores });
      console.log(profile, run, scores);
    }
  }
  const medians = Object.fromEntries(['desktop', 'mobile'].map((profile) => [profile, Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map((category) => [category, results.filter((result) => result.profile === profile).map((result) => result.scores[category]).sort((a, b) => a - b)[1]]))]));
  await writeFile(new URL('audit-summary.json', output), JSON.stringify({ browser: 'Chrome', methodology: 'Three runs per official Lighthouse profile on the production preview, browser cache retained.', results, medians }, null, 2));
  console.log('Median scores', medians);
} finally { await browser.close(); }
