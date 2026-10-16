import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/localization/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario, observed); };
async function settled() { await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished)); }); }
async function shot(name) { await settled(); await page.screenshot({ path: new URL(name + '.png', output).pathname }); }
async function choose(name, value) { await page.getByRole('combobox', { name, exact: true }).click(); await page.getByRole('option', { name: value, exact: true }).click(); }
async function data() { await page.getByRole('tab', { name: 'Data', exact: true }).click(); await page.locator('.code-scroll code').waitFor(); return await readGridData(page); }
async function surface() { return page.evaluate(() => ({
  shell: getComputedStyle(document.querySelector('.app-header')).backgroundColor,
  rootCanvas: getComputedStyle(document.documentElement).getPropertyValue('--pg-canvas').trim(),
  gridCanvas: getComputedStyle(document.querySelector('.preview-theme')).getPropertyValue('--pg-canvas').trim(),
  gridChrome: getComputedStyle(document.querySelector('.preview-theme')).getPropertyValue('--pg-chrome').trim(),
  mode: document.querySelector('.preview-theme').dataset.previewMode,
  preset: document.querySelector('.preview-theme').dataset.previewPreset,
})); }
try {
  await page.goto(origin + '/?sample=editing');
  await page.locator('.grid-preview [role=grid]').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
  await shot('korean-default');
  const row = page.locator('[data-owp-data-grid-row-key="string:task-1"]');
  await row.locator('.OwpDataGrid-cell').nth(1).click(); await page.keyboard.press('Enter');
  await row.locator('input:not([type=checkbox])').fill('언어 전환 확인'); await page.keyboard.press('Enter');
  await page.locator('.grid-preview input[type=checkbox]').nth(1).check();
  await page.getByRole('button', { name: '영어로 전환' }).click();
  await page.getByRole('heading', { name: 'Cell editing', exact: true }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.getByRole('columnheader', { name: /Project/ }).first().waitFor();
  await page.waitForFunction(() => document.querySelector('.grid-status-bar').textContent.includes('Selected 1'));
  const current = await data(); assert.equal(current.rows[0].task, '언어 전환 확인'); assert.equal(current.totalRows, 12);
  await page.getByRole('tab', { name: 'Preview', exact: true }).click(); await shot('english-editing');
  pass('language preserves editing and selection', { language: 'en', selected: 1, savedTask: current.rows[0].task, totalRows: current.totalRows });

  const original = await surface();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await choose('Theme', 'Blue'); await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await shot('english-settings-blue-dark');
  await page.getByRole('button', { name: 'Close settings' }).click(); await shot('blue-dark-scoped');
  const dark = await surface(); assert.equal(dark.shell, original.shell); assert.equal(dark.rootCanvas, original.rootCanvas); assert.equal(dark.mode, 'dark'); assert.equal(dark.gridCanvas, '#142038');
  pass('sample theme scope', { shellUnchanged: dark.shell === original.shell, rootUnchanged: dark.rootCanvas === original.rootCanvas, sampleMode: dark.mode, samplePreset: dark.preset });
  const afterTheme = await data(); assert.equal(afterTheme.rows[0].task, '언어 전환 확인');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('textbox', { name: 'Header background', exact: true }).fill('#254c75'); await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Close settings' }).click(); await shot('custom-header');
  const headerBackground = await page.getByRole('columnheader', { name: /Project/ }).first().evaluate(element => {
    for (let node = element; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor;
      if (color !== 'rgba(0, 0, 0, 0)') return color;
    }
    return null;
  });
  assert.equal(headerBackground, 'rgb(37, 76, 117)');
  pass('custom header theme', { headerBackground: 'rgb(37, 76, 117)', editsRetained: afterTheme.rows[0].task });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await writeFile(new URL('axe-scoped.json', output), JSON.stringify(axe, null, 2));
  assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(v => v.id)));
  pass('scoped dark sample accessibility', { violations: axe.violations.length });
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Reset theme', exact: true }).click(); await page.getByRole('button', { name: 'Close settings' }).click();
  const resetTheme = await surface(); assert.equal(resetTheme.preset, 'inherit'); assert.equal(resetTheme.gridCanvas, original.gridCanvas);
  const afterResetTheme = await data(); assert.equal(afterResetTheme.rows[0].task, '언어 전환 확인');
  pass('theme reset preserves data', { preset: resetTheme.preset, savedTask: afterResetTheme.rows[0].task });
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to Korean' }).click();
  await page.getByRole('heading', { name: '셀 편집', exact: true }).waitFor(); assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
  pass('return to Korean', { language: 'ko' });

  await page.goto(origin + '/?sample=row-actions'); await page.locator('.grid-preview [role=grid]').waitFor();
  await page.getByRole('button', { name: '영어로 전환' }).click();
  await page.locator('.grid-preview').getByRole('button', { name: 'Add row', exact: true }).click();
  assert.equal(await page.locator('.OwpDataGrid-rowEditToolbar').getByRole('button', { name: 'Restore deleted', exact: true }).count(), 1);
  assert.equal(await page.locator('.OwpDataGrid-rowEditToolbar').getByRole('button', { name: 'Reset changes', exact: true }).count(), 1);
  await page.waitForFunction(() => document.querySelector('.grid-status-bar').textContent.includes('13 rows'));
  pass('native OWP controls in English', { action: 'Add row', totalRows: 13 });

  await page.setViewportSize({ width: 375, height: 900 }); await shot('english-mobile');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('button', { name: 'Open example menu' }).click(); await shot('english-navigation-mobile');
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Open settings' }).click();
  await choose('Theme', 'Mint'); await shot('english-settings-mobile');
  pass('English mobile containment', { viewport: 375, pageOverflow: false });
  assert.deepEqual(errors, []);
} catch (error) {
  await shot('failure'); console.log('Failure surface', (await page.locator('body').innerText()).slice(-2000)); throw error;
} finally {
  await writeFile(new URL('report.json', output), JSON.stringify({ results, browserErrors: errors }, null, 2));
  await browser.close();
}
