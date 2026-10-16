import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/sample-consolidation';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const results = [];
page.on('pageerror', error => errors.push(error.message));
const row = id => page.locator(`[data-owp-data-grid-row-key="string:${id}"]`);
const button = name => page.locator('.example-controls').getByRole('button', { name, exact: true });
function pass(scenario, observed) {
  results.push({ scenario, observed, pass: true });
  console.log('PASS', scenario, observed);
}
async function load(id) {
  await page.goto(`${origin}/?package=datagrid&sample=${id}`);
  await page.locator('.grid-preview .OwpDataGrid-root').first().waitFor();
}
async function preview() {
  await page.getByRole('tab', { name: '예제', exact: true }).click();
}
async function data() {
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.code-scroll code')?.textContent.startsWith('['));
  return await readGridData(page);
}
async function shot(name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished));
  });
  await page.screenshot({ path: `${output}/${name}.png` });
}
async function tag(label, search) {
  await row('task-1').locator('.OwpDataGrid-cell').nth(2).click();
  if (search !== undefined) await page.getByRole('combobox', { name: '태그', exact: true }).fill(search);
  await page.getByRole('option').filter({ hasText: label }).click();
  await row('task-1').locator('.OwpDataGrid-cell').first().click();
}
async function edit(id, index, value) {
  await row(id).locator('.OwpDataGrid-cell').nth(index).click();
  await page.keyboard.press('Enter');
  await row(id).locator('input:not([type=checkbox])').fill(String(value));
  await page.keyboard.press('Enter');
}
async function worksheetEdit(id, column, value) {
  const columns = ['project', 'task', 'quantity', 'reserved', 'remaining', 'gap', 'completed', 'cost', 'amount', 'rate', 'appliedAmount', 'plannedAmount'];
  const count = await row(id).locator('.OwpDataGrid-cell').count();
  await edit(id, columns.indexOf(column) - (columns.length - count), value);
}
async function styles() {
  return page.evaluate(() => {
    const header = document.querySelector('.custom-style-grid .OwpDataGrid-headerCell');
    const cell = document.querySelector('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell');
    const task = document.querySelector('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell:nth-child(2)');
    return { headerFont: getComputedStyle(header).fontSize, headerColor: getComputedStyle(header).backgroundColor,
      font: getComputedStyle(cell).fontSize, padding: getComputedStyle(cell).paddingLeft,
      italic: getComputedStyle(task).fontStyle, body: getComputedStyle(cell).backgroundColor };
  });
}

try {
  // Given a single select cell, choosing a menu item stores its scalar value without search.
  await load('select');
  assert.equal(await page.locator('.sidebar-package .version').textContent(), '2.0.10');
  await tag('웹');
  let rows = (await data()).rows;
  assert.equal(rows[0].tags, 'web');
  pass('single select without search', { tags: rows[0].tags });

  // Given multiple select, the menu stays open for more choices and blur commits their order.
  await preview(); await button('다중 선택').click();
  await row('task-1').locator('.OwpDataGrid-cell').nth(2).click();
  assert.equal(await page.locator('.grid-preview input[role=combobox]').count(), 0);
  await page.getByRole('option', { name: '모바일', exact: true }).click();
  assert.equal(await page.getByRole('listbox').isVisible(), true);
  await page.getByRole('option', { name: '검증', exact: true }).click();
  await shot('select-multiple-menu');
  await page.locator('.MuiBackdrop-root').click({ position: { x: 1, y: 1 } });
  rows = (await data()).rows;
  assert.equal(rows[0].tags, 'web,mobile,qa');
  pass('native multiple select keeps menu open and has no search input', { tags: rows[0].tags });

  await preview();
  await row('task-1').locator('.OwpDataGrid-cell').nth(2).click();
  await page.getByRole('option', { name: '디자인', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal((await data()).rows[0].tags, 'web,mobile,qa');
  pass('Escape cancels multiple select draft', { tags: 'web,mobile,qa' });

  await preview(); await button('자동완성').click();
  assert.equal((await data()).rows[0].tags, 'web,mobile,qa');
  await preview(); await tag('디자인', '디자');
  assert.equal((await data()).rows[0].tags, 'web,mobile,qa,design');
  pass('multiple autocomplete searches and preserves select values', { tags: 'web,mobile,qa,design' });

  await preview(); await button('단일 선택').click();
  assert.equal((await data()).rows[0].tags, 'web');
  await preview(); await tag('검증', '검');
  assert.equal((await data()).rows[0].tags, 'qa');
  pass('single autocomplete searches; changing to single keeps the first value', { tags: 'qa' });
  await load('autocomplete');
  assert.equal(await button('자동완성').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.nav-item').filter({ hasText: /^자동완성$/ }).count(), 0);
  pass('legacy autocomplete link resolves to the merged sample', { url: page.url() });

  await load('visible-rows');
  assert.equal(await page.locator('.sample-heading h1').textContent(), '표시 행 수 고정');
  assert.equal(await page.locator('.grid-preview [data-owp-data-grid-row-key^="string:task-"]').count(), 10);
  await page.locator('.grid-preview input[type=checkbox]').nth(1).check();
  assert.match(await page.locator('.preview-status').textContent(), /선택 1/);
  assert.ok((await page.locator('.OwpDataGrid-summary').textContent()).includes('전체 합계'));
  assert.equal((await data()).totalRows, 10);
  await preview(); await shot('fixed-rows');
  pass('fixed rows retain ten populated rows, selection and totals', { count: 10 });

  await load('minimal');
  assert.equal(await page.locator('.sample-heading h1').textContent(), '표시 행 수 고정');
  const catalog = await (await page.request.get(`${origin}/catalog.json`)).json();
  assert.equal(catalog.samples.filter(sample => sample.kind === 'grid').length, 47);
  assert.equal(catalog.samples[0].id, 'getting-started');
  assert.equal(catalog.samples.some(sample => ['minimal', 'visible-rows', 'loading'].includes(sample.id)), false);
  pass('removed samples resolve to current examples and catalog has 47 entries', { count: 47 });

  await load('loading');
  assert.equal(await page.locator('.sample-heading h1').textContent(), '데이터 없음');
  assert.equal(await page.getByRole('button', { name: '로딩 시작', exact: true }).getAttribute('aria-pressed'), 'false');
  assert.ok((await page.locator('.grid-preview').textContent()).includes('조회된 작업이 없습니다.'));
  await page.getByRole('button', { name: '로딩 시작', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '로딩 종료', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.grid-preview .MuiCircularProgress-root').isVisible(), true);
  await shot('empty-loading');
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Stop loading', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  await page.getByRole('button', { name: '로딩 종료', exact: true }).click();
  assert.equal(await page.locator('.grid-preview .MuiCircularProgress-root').isVisible(), false);
  assert.ok((await page.locator('.grid-preview').textContent()).includes('조회된 작업이 없습니다.'));
  assert.equal((await data()).totalRows, 0);
  await preview(); await page.getByRole('button', { name: '로딩 시작', exact: true }).click();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '로딩 시작', exact: true }).getAttribute('aria-pressed'), 'false');
  pass('empty grid loading starts, stops and resets without adding data', { count: 0 });

  await load('design-system');
  assert.equal(await button('행 삭제').isDisabled(), true);
  await button('첫 행 선택').click();
  assert.equal(await button('행 삭제').isEnabled(), true);
  await button('선택 해제').click();
  assert.equal(await button('행 삭제').isDisabled(), true);
  await button('첫 행 선택').click(); await button('행 삭제').click();
  assert.equal((await data()).totalRows, 11);
  pass('external buttons select, clear and delete', { remaining: 11 });

  await load('custom-style');
  const styled = await styles();
  assert.equal(styled.font, '14px'); assert.equal(styled.italic, 'italic');
  await edit('task-1', 1, '스타일 변경 후 유지할 작업');
  assert.equal(await page.locator('.custom-style-size input').getAttribute('aria-valuenow'), '14');
  assert.equal(await page.locator('.example-caption').count(), 0);
  await button('기본').click();
  const plain = await styles();
  assert.notEqual(plain.font, styled.font); assert.equal(plain.italic, 'normal');
  assert.equal(await page.getByRole('slider', { name: '글자 크기', exact: true }).isDisabled(), true);
  assert.equal((await data()).rows[0].task, '스타일 변경 후 유지할 작업');
  await preview(); await button('강조').click();
  const emphasis = await styles();
  assert.notEqual(emphasis.headerColor, styled.headerColor);
  const slider = page.getByRole('slider', { name: '글자 크기', exact: true });
  await slider.focus(); await slider.press('End');
  assert.equal((await styles()).font, '18px');
  assert.equal((await data()).rows[0].task, '스타일 변경 후 유지할 작업');
  await preview(); await shot('custom-style-emphasis-large');
  assert.equal(Math.round((await row('task-1').boundingBox()).height), 44);
  const emphasizedHeader = page.locator('.custom-style-grid .OwpDataGrid-headerLabel').first();
  const headerTextColor = await emphasizedHeader.evaluate(element => getComputedStyle(element).color);
  await emphasizedHeader.hover();
  assert.equal(await emphasizedHeader.evaluate(element => getComputedStyle(element).color), headerTextColor);
  const emphasisAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(emphasisAxe.violations, []);
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.equal(await button('Emphasis').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('slider', { name: 'Font size', exact: true }).getAttribute('aria-valuenow'), '18');
  assert.ok((await page.locator('.custom-style-grid .OwpDataGrid-headerLabel').allTextContents()).includes('Notes'));
  await shot('custom-style-en');
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  await button('줄무늬').click();
  await slider.focus(); await slider.press('Home'); await slider.press('ArrowRight'); await slider.press('ArrowRight');
  pass('style presets and font size apply without resetting edits', { styled, plain, emphasis, maxFont: '18px' });
  await page.getByRole('button', { name: '다크 모드로 전환' }).click();
  const dark = await styles();
  await shot('custom-style-dark');
  assert.notEqual(dark.headerColor, styled.headerColor);
  assert.equal(await page.locator('.sample-theme').getAttribute('data-preview-mode'), 'dark');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await writeFile(`${output}/axe-custom-dark.json`, JSON.stringify(axe, null, 2));
  assert.deepEqual(axe.violations, []);
  pass('custom style inherits dark theme with no axe violations', { dark, violations: 0 });
  await button('강조').click();
  await shot('custom-style-dark-emphasis');
  const darkEmphasisAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(darkEmphasisAxe.violations, []);
  await page.getByRole('button', { name: '라이트 모드로 전환' }).click();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  assert.equal(await button('줄무늬').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('slider', { name: '글자 크기', exact: true }).getAttribute('aria-valuenow'), '14');
  await page.getByRole('tab', { name: '코드', exact: true }).click();
  const source = await readFile('src/playgrounds/datagrid/examples/custom-style.tsx', 'utf8');
  await page.waitForFunction(source => document.querySelector('.code-scroll code')?.textContent === source, source);
  pass('custom style code tab shows the exact executable source', { bytes: source.length });

  await load('context-menu');
  await row('task-1').locator('.OwpDataGrid-cell').nth(1).click({ button: 'right' });
  assert.equal(await page.getByRole('menuitem').locator('svg').count(), 3);
  await shot('context-menu-icons');
  await page.getByRole('menuitem', { name: '상세 보기', exact: true }).click();
  assert.equal(await page.getByRole('dialog').getByRole('textbox', { name: '작업명' }).getAttribute('readonly'), '');
  await page.getByRole('dialog').getByRole('button', { name: '닫기', exact: true }).click();
  await row('task-1').locator('.OwpDataGrid-cell').nth(1).click({ button: 'right' });
  await page.getByRole('menuitem', { name: '작업 수정', exact: true }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: '작업명' }).fill('아이콘 메뉴에서 수정');
  await page.getByRole('dialog').getByRole('button', { name: '변경 적용', exact: true }).click();
  assert.equal((await data()).rows[0].task, '아이콘 메뉴에서 수정');
  await preview();
  await row('task-1').locator('.OwpDataGrid-cell').nth(1).click({ button: 'right' });
  await page.getByRole('menuitem', { name: '행 삭제', exact: true }).click();
  assert.equal((await data()).totalRows, 11);
  pass('icon context menu views, edits and deletes', { icons: 3, remaining: 11 });

  await load('worksheet');
  await worksheetEdit('task-3', 'completed', 80);
  rows = (await data()).rows;
  assert.equal(rows.find(r => r.id === 'task-4').rate, 88);
  await preview(); await worksheetEdit('task-4', 'completed', 60);
  rows = (await data()).rows;
  assert.equal(rows.find(r => r.id === 'task-8').rate, 93);
  await preview(); await worksheetEdit('rate-0', 'rate', 50);
  rows = (await data()).rows;
  assert.equal(rows.find(r => r.id === 'task-1').rate, 50);
  assert.equal(rows.find(r => r.id === 'task-4').rate, 48);
  assert.equal(rows.find(r => r.id === 'task-8').rate, 93);
  pass('same-project, cross-project and base rate links', { rates: rows.filter(r => r.worksheetKind === 'item').map(r => r.rate) });
  await preview(); await worksheetEdit('task-1', 'cost', 20000);
  assert.ok((await row('task-1').textContent()).includes('80,000'));
  await shot('worksheet-linked');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  rows = (await data()).rows;
  assert.equal(rows.find(r => r.id === 'task-4').rate, 90);
  assert.equal(rows.find(r => r.id === 'task-1').cost, 12000);
  pass('calculated cost and reset restore linked values', { appliedCost: 80000, resetRate: 90 });

  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const id of ['custom-style', 'select', 'overview', 'empty', 'design-system', 'renderer', 'conditional', 'headers', 'reordering', 'excel-snapshot', 'worksheet', 'tree', 'nested-tree']) {
      await load(id);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${id}/${width}`);
      await shot(`${id}-${width}`);
    }
    await load('custom-style');
    assert.equal((await styles()).font, '14px');
    await button('강조').click();
    await shot(`custom-style-emphasis-${width}`);
    await load('empty'); await page.getByRole('button', { name: '로딩 시작', exact: true }).click();
    await shot(`loading-${width}`);
    pass(`changed samples and loading fit ${width}px`, { width });
  }
  assert.deepEqual(errors, []);
} catch (error) {
  await shot('failure');
  throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
