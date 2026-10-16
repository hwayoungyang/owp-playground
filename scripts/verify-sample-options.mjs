import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/sample-options';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
const results = [];
const captures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const row = id => page.locator(`[data-owp-data-grid-row-key="string:${id}"]`);
const cell = (id, index) => row(id).locator('.OwpDataGrid-cell').nth(index);
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario, observed); };
async function settle() { await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished)); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }); }
async function shot(name) { await settle(); const path = `${output}/${name}.png`; await page.screenshot({ path }); captures.push({ path, viewport: page.viewportSize() }); }
async function load(id) { await page.goto(`${origin}/?sample=${id}`); await page.locator('.OwpDataGrid-root').first().waitFor(); }
async function choose(name, value) { await page.getByRole('combobox', { name, exact: true }).click(); await page.locator(`[role=option][data-value="${value}"]`).click(); }
async function preview() { await page.getByRole('tab', { name: '예제', exact: true }).click(); }
async function data() { await page.getByRole('tab', { name: '데이터', exact: true }).click(); await page.waitForFunction(() => document.querySelector('.code-scroll code')?.textContent.startsWith('[')); return (await readGridData(page)).rows; }
async function edit(id, index, value) { await cell(id, index).click(); await page.keyboard.press('Enter'); const input = row(id).locator('input:not([type=checkbox])'); await input.fill(String(value)); await input.press('Enter'); }
async function sourceMatches(id) { await page.getByRole('tab', { name: '코드', exact: true }).click(); const source = await readFile(`src/playgrounds/datagrid/examples/${id}.tsx`, 'utf8'); await page.waitForFunction(source => document.querySelector('.code-scroll code')?.textContent === source, source); const published = await page.request.get(`${origin}/snippets/samples/examples/${id}.tsx`); assert.equal(await published.text(), source); }
function noHistory() { return page.locator('.change-history, .change-list').count(); }

try {
  await page.goto(`${origin}/?sample=getting-started`);
  await page.locator('.getting-started').waitFor();
  assert.equal(await page.locator('.sample-heading p').count(), 0);
  assert.equal(await page.locator('.guide-code').count(), 3);
  await shot('guide-ko');
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.equal(await page.locator('.sample-heading p').count(), 0);
  await shot('guide-en');
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  pass('guide has a title without a subtitle and retains setup, dependencies and usage', { subtitle: false, codeBlocks: 3 });

  await load('formatting');
  assert.equal((await cell('task-1', 2).textContent()).trim(), '12,000.00');
  await choose('금액 소수 자릿수', 1);
  await edit('task-1', 2, 1234.5);
  assert.equal((await data())[0].cost, 1234.5);
  await preview();
  assert.equal(await noHistory(), 0);
  await choose('금액 소수 자릿수', 6);
  await cell('task-1', 2).click();
  await page.keyboard.press('Enter');
  const amountInput = row('task-1').locator('input:not([type=checkbox])');
  await amountInput.fill('1234.123456');
  const allowedValue = await amountInput.inputValue();
  await amountInput.press('End');
  await amountInput.press('7');
  assert.equal(await amountInput.inputValue(), allowedValue);
  await amountInput.press('Enter');
  assert.equal((await data())[0].cost, 1234.123456);
  await preview();
  for (const digits of [1, 2, 3, 4, 5, 6]) {
    await choose('금액 소수 자릿수', digits);
    const expected = new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(1234.123456);
    assert.equal((await cell('task-1', 2).textContent()).trim(), expected);
  }
  assert.equal((await data())[0].cost, 1234.123456);
  await preview();
  await shot('formatting-six-digits');
  await choose('금액 소수 자릿수', 3);
  await edit('task-1', 2, 1234.567);
  assert.equal((await data())[0].cost, 1234.567);
  await preview();
  assert.equal(await noHistory(), 0);
  assert.match(await page.locator('.preview-status').textContent(), /변경 1/);
  await cell('task-1', 6).click();
  await page.keyboard.press('Enter');
  assert.equal(await row('task-1').locator('input:not([type=checkbox])').inputValue(), '09:30:00');
  await page.keyboard.press('Escape');
  await sourceMatches('formatting');
  await preview();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  assert.equal(await page.getByRole('combobox', { name: '금액 소수 자릿수', exact: true }).textContent(), '2');
  assert.equal((await cell('task-1', 2).textContent()).trim(), '12,000.00');
  pass('amount precision controls display and editing from one through six digits without resetting values', { entered: [1234.5, 1234.123456, 1234.567], extraDigitRejected: true, resetDigits: 2 });

  await load('custom-style');
  const projectHeader = page.locator('.custom-style-grid .OwpDataGrid-headerCell').first();
  assert.equal(await projectHeader.getAttribute('aria-rowspan'), '2');
  await edit('task-1', 1, '헤더 변경 후 유지할 작업');
  await choose('헤더 단계', 3);
  assert.equal(await projectHeader.getAttribute('aria-rowspan'), '3');
  const mainHeader = page.locator('.OwpDataGrid-headerCell:has(.custom-style-group-title[data-tier=main])');
  assert.equal(await mainHeader.getAttribute('aria-colspan'), '3');
  assert.equal((await data())[0].task, '헤더 변경 후 유지할 작업');
  await preview();
  assert.equal(await noHistory(), 0);
  await shot('custom-three-striped');
  const presetButton = name => page.locator('.example-controls').getByRole('button', { name, exact: true });
  await presetButton('강조').click();
  const fontSlider = page.getByRole('slider', { name: '글자 크기', exact: true });
  await fontSlider.focus();
  await fontSlider.press('End');
  assert.equal(await fontSlider.getAttribute('aria-valuenow'), '18');
  await settle();
  assert.equal(Math.round((await projectHeader.boundingBox()).height), 144);
  assert.equal(Math.round((await row('task-1').boundingBox()).height), 44);
  await shot('custom-three-emphasis-large');
  await settle();
  let axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))));
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.equal(await page.getByRole('combobox', { name: 'Header levels', exact: true }).textContent(), '3 levels');
  assert.equal(await page.getByRole('slider', { name: 'Font size', exact: true }).getAttribute('aria-valuenow'), '18');
  assert.ok((await page.locator('.custom-style-group-title').allTextContents()).includes('Work overview'));
  await shot('custom-three-en');
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  await page.getByRole('button', { name: '다크 모드로 전환' }).click();
  await page.waitForFunction(() => document.querySelector('.sample-theme').dataset.previewMode === 'dark');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.package-selector')).color === 'rgb(237, 237, 237)');
  await settle();
  axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))));
  await shot('custom-three-dark');
  await page.getByRole('button', { name: '라이트 모드로 전환' }).click();
  await presetButton('기본').click();
  assert.equal(await fontSlider.isDisabled(), true);
  assert.equal(await projectHeader.getAttribute('aria-rowspan'), '3');
  assert.equal((await data())[0].task, '헤더 변경 후 유지할 작업');
  await preview();
  await choose('헤더 단계', 2);
  assert.equal(await projectHeader.getAttribute('aria-rowspan'), '2');
  await sourceMatches('custom-style');
  await preview();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  assert.equal(await page.getByRole('combobox', { name: '헤더 단계', exact: true }).textContent(), '2단');
  assert.equal(await fontSlider.getAttribute('aria-valuenow'), '14');
  pass('two and three-level headers, styles, fonts and language switches preserve edits and reset correctly', { lightAxe: 0, darkAxe: 0, maxFont: 18, levels: [2, 3] });

  await load('ref-changes');
  const original = (await cell('task-1', 1).textContent()).trim();
  await edit('task-1', 1, '되돌리기 확인');
  assert.equal(await noHistory(), 0);
  await page.locator('.example-controls').getByRole('button', { name: '변경 되돌리기', exact: true }).click();
  assert.equal((await cell('task-1', 1).textContent()).trim(), original);
  await edit('task-1', 1, '확정된 작업');
  await page.locator('.example-controls').getByRole('button', { name: '변경 확정', exact: true }).click();
  assert.equal((await cell('task-1', 1).textContent()).trim(), '확정된 작업');
  assert.match(await page.locator('.preview-status').textContent(), /변경 0/);
  pass('removing the shared history leaves native change approval and rollback functional', { approved: true, rolledBack: true, historyPanel: false });

  const catalog = await (await page.request.get(`${origin}/catalog.json`)).json();
  const gridSamples = catalog.samples.filter(sample => sample.kind === 'grid');
  for (const sample of gridSamples) {
    await load(sample.id);
    await settle();
    assert.equal(await noHistory(), 0, sample.id);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, sample.id);
    await shot(`desktop-${sample.id}`);
  }
  pass('all grid routes load without the shared history or page overflow', { routes: gridSamples.length, width: 1280 });
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ['getting-started', 'overview', 'formatting', 'custom-style']) {
      if (id === 'getting-started') { await page.goto(`${origin}/?sample=${id}`); await page.locator('.getting-started').waitFor(); }
      else await load(id);
      await settle();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${id}/${width}`);
      await shot(`${id}-${width}`);
    }
    await choose('헤더 단계', 3);
    await page.locator('.example-controls').getByRole('button', { name: '강조', exact: true }).click();
    await shot(`custom-three-emphasis-${width}`);
  }
  pass('affected pages and three-level styled headers fit tablet and mobile layouts', { widths: [768, 375] });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors, captures }, null, 2));
  console.log('PASS', results.length, 'sample-option scenarios;', captures.length, 'screenshots');
} finally { await browser.close(); }
