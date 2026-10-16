import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/sample-polish';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
const results = [];
const captures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario, observed); };
async function settle() { await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished)); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }); }
async function shot(name) { await settle(); const path = `${output}/${name}.png`; await page.screenshot({ path }); captures.push({ path, viewport: page.viewportSize() }); }
async function load(id) { await page.goto(`${origin}/?sample=${id}`); await page.locator(id === 'getting-started' ? '.getting-started' : '.OwpDataGrid-root').first().waitFor(); await settle(); }
async function choose(name, value) { await page.getByRole('combobox', { name, exact: true }).click(); await page.locator(`[role=option][data-value="${value}"]`).click(); }
const preset = name => page.locator('.example-controls').getByRole('button', { name, exact: true });
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function alignedOptions() {
  const boxes = await page.locator('.example-option-row').evaluateAll(rows => rows.map(row => [...row.children].map(child => { const rect = child.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scrollWidth: child.scrollWidth, clientWidth: child.clientWidth }; })));
  assert.equal(boxes.length, 2);
  for (let index = 0; index < 3; index++) {
    assert.ok(Math.abs(boxes[0][index].x - boxes[1][index].x) <= 1, JSON.stringify(boxes));
    assert.ok(Math.abs(boxes[0][index].width - boxes[1][index].width) <= 1, JSON.stringify(boxes));
  }
  for (const row of boxes) {
    assert.ok(Math.abs(row[1].y - row[2].y) <= 1, JSON.stringify(boxes));
    assert.ok(row[2].x >= row[1].x + row[1].width + 4, JSON.stringify(boxes));
    assert.equal(row[1].height, row[2].height);
    assert.ok(Math.abs(row[1].width - row[2].width) <= 1);
    for (const button of row.slice(1)) assert.ok(button.scrollWidth <= button.clientWidth + 1, JSON.stringify(boxes));
  }
  return boxes;
}
async function headerColors() { return page.locator('.custom-style-grid .OwpDataGrid-headerCell').evaluateAll(headers => headers.map(header => ({ background: getComputedStyle(header).backgroundColor, label: getComputedStyle(header.querySelector('.OwpDataGrid-headerLabel')).color }))); }
async function datasetEvent() { await page.getByRole('tab', { name: /^이벤트/ }).click(); const text = await page.locator('.events-panel').textContent(); const record = text.match(/\{\s*"count":\s*(\d+),\s*"bindingMs":\s*([\d.]+)\s*\}/); assert.ok(record, text); return { count: Number(record[1]), milliseconds: Number(record[2]), text }; }

try {
  await load('getting-started');
  assert.match(await page.locator('.guide-note').textContent(), /OWP 패키지 레지스트리 URL.*Impix SmartBiz/);
  const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox();
  const linkBox = await page.getByRole('button', { name: '링크 복사', exact: true }).boundingBox();
  assert.ok(linkBox.x >= titleBox.x + titleBox.width && linkBox.x - titleBox.x - titleBox.width < 12);
  assert.ok(Math.abs((titleBox.y + titleBox.height / 2) - (linkBox.y + linkBox.height / 2)) <= 1);
  assert.equal((await page.locator('.share-button').textContent()).trim(), '');
  await page.getByRole('button', { name: '링크 복사', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '링크를 복사했습니다.' }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), page.url());
  await shot('guide-link');
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.match(await page.locator('.guide-note').textContent(), /OWP package registry URL.*Impix SmartBiz team/);
  assert.equal(await page.getByRole('button', { name: 'Copy link', exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  pass('registry explanation names the URL and Impix SmartBiz; inline icon copies the current link in both languages', { inline: true, clipboard: true });

  await load('select');
  await alignedOptions();
  await preset('자동완성').click();
  await preset('다중 선택').click();
  assert.equal(await preset('자동완성').getAttribute('aria-pressed'), 'true');
  assert.equal(await preset('다중 선택').getAttribute('aria-pressed'), 'true');
  await shot('select-aligned');
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await settle();
    await alignedOptions();
    assert.equal(await noOverflow(), true);
    await shot(`select-${width}`);
    await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
    await settle();
    await alignedOptions();
    assert.equal(await noOverflow(), true);
    await shot(`select-en-${width}`);
    await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  }
  pass('editor and selection controls have aligned label and equal button columns in Korean and English', { widths: [1280, 768, 375] });
  await page.setViewportSize({ width: 1280, height: 1000 });

  await load('excel');
  const excelButton = page.getByRole('button', { name: 'Excel', exact: true });
  assert.equal(await excelButton.locator('.MuiButton-startIcon svg').count(), 1);
  const downloadPromise = page.waitForEvent('download');
  await excelButton.click();
  await page.getByRole('dialog').getByRole('button', { name: '다운로드', exact: true }).click();
  assert.match((await downloadPromise).suggestedFilename(), /\.xlsx$/);
  await shot('excel-icon');
  pass('Excel export has a start icon and still downloads an xlsx file', { icon: true, downloaded: true });

  await load('formatting');
  assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), '숫자·날짜 서식');
  assert.match(await page.locator('.sample-heading p').textContent(), /숫자와 날짜·시간 서식/);
  await choose('금액 소수 자릿수', 6);
  const firstAmount = page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').nth(2);
  assert.equal((await firstAmount.textContent()).trim(), '12,000.000000');
  await shot('formatting-copy');
  pass('numeric copy names the amount column and the decimal selector still controls its format', { digits: 6 });

  await load('custom-style');
  const styleResults = [];
  for (const mode of ['light', 'dark']) {
    if (mode === 'dark') {
      await page.getByRole('button', { name: '다크 모드로 전환', exact: true }).click();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.package-selector')).color === 'rgb(237, 237, 237)');
    }
    for (const depth of [2, 3]) {
      await choose('헤더 단계', depth);
      await preset('줄무늬').click();
      await settle();
      const striped = await headerColors();
      assert.equal(new Set(striped.map(header => header.background)).size, 1, JSON.stringify(striped));
      await shot(`custom-${mode}-${depth}-striped`);
      await preset('강조').click();
      await settle();
      const emphasis = await headerColors();
      assert.equal(new Set(emphasis.map(header => header.background)).size, 1, JSON.stringify(emphasis));
      assert.notEqual(emphasis[0].background, striped[0].background);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))));
      await shot(`custom-${mode}-${depth}-emphasis`);
      styleResults.push({ mode, depth, striped: striped[0].background, emphasis: emphasis[0].background, axe: 0 });
    }
  }
  await page.getByRole('button', { name: '라이트 모드로 전환', exact: true }).click();
  pass('all header tiers follow striped and emphasis presets at both depths and themes', styleResults);

  await load('large-data');
  const generate = page.getByRole('button', { name: '데이터 생성', exact: true });
  await page.locator('.binding-time').waitFor();
  assert.match(await page.locator('.binding-time').textContent(), /그리드 반영 시간 [\d.]+ ms/);
  const initial = await datasetEvent();
  assert.equal(initial.count, 10000);
  assert.ok(initial.milliseconds > 0);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  assert.ok((await generate.getAttribute('class')).includes('MuiButton-outlined'));
  await choose('생성할 데이터 건수', 100000);
  assert.ok((await generate.getAttribute('class')).includes('MuiButton-contained'));
  await page.evaluate(() => {
    const original = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => original(callback, delay === 0 ? 100 : delay, ...args);
    window.qaStarted = performance.now();
  });
  await generate.click();
  await page.locator('.binding-time').waitFor();
  const elapsed = await page.evaluate(() => performance.now() - window.qaStarted);
  const timing = await page.locator('.binding-time').textContent();
  assert.match(timing, /그리드 반영 시간 [\d.]+ ms/);
  assert.match(timing, /테스트 환경에 따라/);
  assert.ok((await generate.getAttribute('class')).includes('MuiButton-outlined'));
  const event = await datasetEvent();
  assert.equal(event.count, 100000);
  assert.ok(event.milliseconds > 0 && event.milliseconds < elapsed - 1000, JSON.stringify({ elapsed, event }));
  assert.equal(event.text.includes('generationMs'), false);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  assert.match(await page.locator('.preview-status').textContent(), /100,000행/);
  await shot('large-bound');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await page.locator('.binding-time').waitFor();
  const reset = await datasetEvent();
  assert.equal(reset.count, 10000);
  assert.ok(reset.milliseconds > 0);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  assert.ok((await generate.getAttribute('class')).includes('MuiButton-outlined'));
  await choose('생성할 데이터 건수', 1000000);
  await generate.click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await generate.waitFor();
  assert.equal(await generate.isDisabled(), false);
  assert.equal(await page.locator('.binding-time').count(), 0);
  assert.match(await page.locator('.preview-status').textContent(), /0행/);
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await page.locator('.binding-time').waitFor();
  assert.match(await page.locator('.preview-status').textContent(), /10,000행/);
  pass('large-data measures initial load and reset, highlights unapplied counts, excludes deliberately slow generation, and clears timing on cancel', { initialBindingMs: initial.milliseconds, resetBindingMs: reset.milliseconds, count: event.count, bindingMs: event.milliseconds, elapsedMs: Math.round(elapsed), cancelled: true });

  await load('large-data');
  await choose('생성할 데이터 건수', 1000000);
  await generate.click();
  await page.locator('.binding-time').waitFor({ timeout: 60000 });
  assert.match(await page.locator('.preview-status').textContent(), /1,000,000행/);
  assert.ok(await page.locator('.OwpDataGrid-row[data-owp-data-grid-row-key]').count() < 100);
  const million = await datasetEvent();
  assert.equal(million.count, 1000000);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await shot('large-million');
  pass('one million rows bind and display with virtualized DOM and a binding measurement', { count: million.count, bindingMs: million.milliseconds });

  const catalog = await (await page.request.get(`${origin}/catalog.json`)).json();
  for (const sample of catalog.samples) {
    await load(sample.id);
    const title = await page.getByRole('heading', { level: 1 }).boundingBox();
    const link = await page.getByRole('button', { name: '링크 복사', exact: true }).boundingBox();
    assert.ok(link.x - title.x - title.width < 12 && link.x >= title.x + title.width, sample.id);
    assert.equal(await noOverflow(), true, sample.id);
    await shot(`desktop-${sample.id}`);
  }
  pass('every guide and grid route has the inline copy link without page overflow', { routes: catalog.samples.length });
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ['getting-started', 'combined-span', 'formatting', 'excel', 'large-data', 'custom-style']) {
      await load(id);
      if (id === 'custom-style') { await choose('헤더 단계', 3); await preset('강조').click(); }
      if (id === 'large-data') { await generate.click(); await page.locator('.binding-time').waitFor(); }
      assert.equal(await noOverflow(), true, `${id}/${width}`);
      await shot(`${id}-${width}`);
    }
  }
  pass('affected pages, inline links and measurements fit mobile/tablet layouts', { widths: [768, 375] });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors, captures }, null, 2));
  console.log('PASS', results.length, 'polish scenarios;', captures.length, 'screenshots');
} finally { await browser.close(); }
