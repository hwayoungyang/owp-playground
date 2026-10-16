import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { loadExcelJSBrowser } from '@owp/excel';
import AxeBuilder from '@axe-core/playwright';
const output = '.omo/evidence/cell-examples';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const errors = [];
const results = [];
page.on('pageerror', (e) => errors.push(e.message));
const pass = (scenario, observed) => {
  results.push({ scenario, observed, pass: true });
  console.log('PASS', scenario, observed);
};
const row = () => page.locator('[data-owp-data-grid-row-key="string:task-1"]');
async function load(id) {
  await page.goto('http://127.0.0.1:4173/?package=datagrid&sample=' + id);
  await page.locator('.grid-preview .OwpDataGrid-root').first().waitFor();
}
async function data(language = 'ko') {
  await page.getByRole('tab', { name: language === 'ko' ? '데이터' : 'Data', exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector('.code-scroll code')?.textContent.startsWith('['),
  );
  return (await readGridData(page)).rows;
}
async function preview(language = 'ko') {
  await page
    .getByRole('tab', { name: language === 'ko' ? '예제' : 'Preview', exact: true })
    .click();
}
async function addTag(label, search) {
  await row().locator('.OwpDataGrid-cell').nth(2).click();
  await page.getByRole('combobox', { name: '태그', exact: true }).fill(search);
  await page.getByRole('option').filter({ hasText: label }).click();
  await row().locator('.OwpDataGrid-cell').first().click();
}
async function source(id) {
  await page.getByRole('tab', { name: '코드', exact: true }).click();
  const expected = await readFile('src/playgrounds/datagrid/examples/' + id + '.tsx', 'utf8');
  await page.waitForFunction(
    (expected) => document.querySelector('.code-scroll code')?.textContent === expected,
    expected,
  );
  assert.ok(
    (await page.locator('.code-scroll .hljs-name').allTextContents()).includes('OwpDataGrid'),
  );
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: '다운로드', exact: true }).click();
  const file = await downloaded;
  await file.saveAs(output + '/' + id + '.tsx');
  assert.equal(await readFile(output + '/' + id + '.tsx', 'utf8'), expected);
  pass(id + ' exact highlighted executable source', { bytes: expected.length });
}
async function a11y(id) {
  const report = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(report.violations, [], id + ' accessibility');
  pass(id + ' axe accessibility', { violations: report.violations.length });
}
try {
  await load('select');
  assert.equal(
    await page.getByRole('button', { name: '단일 선택', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await row().locator('.OwpDataGrid-cell').nth(2).click();
  await page.getByRole('option', { name: '웹', exact: true }).click();
  await page.locator('[data-owp-data-grid-row-key="string:task-2"] .OwpDataGrid-cell').nth(2).click();
  await page.getByRole('option', { name: '검증', exact: true }).click();
  let rows = await data();
  assert.equal(rows[0].tags, 'web');
  pass('single select commits a scalar value', { tags: rows[0].tags });
  await preview();
  await page.getByRole('button', { name: '다중 선택', exact: true }).click();
  await page.getByRole('button', { name: '자동완성', exact: true }).click();
  await addTag('모바일', '모바');
  rows = await data();
  assert.equal(rows[0].tags, 'web,mobile');
  pass('multi select searches and adds a second value', { tags: rows[0].tags });
  await preview();
  await page.getByRole('button', { name: '단일 선택', exact: true }).click();
  rows = await data();
  assert.equal(rows[0].tags, 'web');
  assert.equal(rows[1].tags, 'qa');
  pass('single mode retains first value without resetting other rows', {
    tags: rows[0].tags,
    second: rows[1].tags,
  });
  await preview();
  await page.getByRole('button', { name: '다중 선택', exact: true }).click();
  await addTag('검증', '검');
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Multiple', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  assert.ok((await row().textContent()).includes('QA'));
  rows = await data('en');
  assert.equal(rows[0].tags, 'web,qa');
  pass('language switch preserves mode and selected values', { tags: rows[0].tags });
  await preview('en');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Single', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  rows = await data('en');
  assert.equal(rows[0].tags, 'design');
  pass('reset restores select fixture and single mode', { tags: rows[0].tags });
  await preview('en');
  await a11y('select');
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  await source('select');
  await load('renderer');
  await page.getByRole('button', { name: '설정 열기', exact: true }).click();
  await page.getByRole('combobox', { name: '행 선택 방식', exact: true }).click();
  await page.getByRole('option', { name: '다중 선택', exact: true }).click();
  await page.getByRole('button', { name: '설정 닫기', exact: true }).click();
  await row().getByRole('button').focus();
  await page.keyboard.press('Enter');
  assert.equal(await row().getByRole('progressbar').getAttribute('aria-valuenow'), '100');
  assert.equal(await row().getByRole('button').isDisabled(), true);
  assert.equal(await row().getByRole('checkbox', { name: '행 선택', exact: true }).isChecked(), false);
  rows = await data();
  assert.equal(rows[0].status, '완료');
  assert.equal(rows[0].completed, rows[0].quantity);
  pass('cell button atomically completes status and quantity', {
    status: rows[0].status,
    completed: rows[0].completed,
  });
  await preview();
  await row().getByRole('switch').focus();
  await page.keyboard.press('Space');
  rows = await data();
  assert.equal(rows[0].active, true);
  await preview();
  assert.equal(await row().getByRole('checkbox', { name: '행 선택', exact: true }).isChecked(), false);
  pass('switch keyboard action updates row value without selecting the row', { active: rows[0].active });
  await preview();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '다운로드', exact: true }).click();
  const file = await pending;
  const path = output + '/cell-components.xlsx';
  await file.saveAs(path);
  const ExcelJS = await loadExcelJSBrowser();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(path));
  const sheet = workbook.worksheets[0];
  const values = [];
  sheet.eachRow((r) => values.push(r.values));
  assert.ok(values.some((r) => r.includes('완료') && r.includes(100) && r.includes('켜짐')));
  assert.equal(sheet.columnCount, 5);
  pass('Excel exports values and omits action column', {
    columns: sheet.columnCount,
    firstRows: values.slice(0, 3),
  });
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.ok((await row().textContent()).includes('Completed'));
  assert.equal(await row().getByRole('switch').isChecked(), true);
  assert.ok(
    (await page.locator('.example-caption').allTextContents()).some((t) =>
      t.includes('properties and events'),
    ),
  );
  pass('component language switch retains changes and translates configuration caption', { checked: true });
  await a11y('renderer');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  assert.equal(await row().getByRole('progressbar').getAttribute('aria-valuenow'), '20');
  assert.equal(await row().getByRole('switch').isChecked(), false);
  assert.equal(await row().getByRole('button').isEnabled(), true);
  pass('component reset restores button switch and progress', { progress: 20, active: false });
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  await source('renderer');
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1100 });
    await load('select');
    await page.getByRole('button', { name: '다중 선택', exact: true }).click();
    await page.getByRole('button', { name: '자동완성', exact: true }).click();
    await addTag('모바일', '모바');
    rows = await data();
    assert.equal(rows[0].tags, 'design,mobile');
    await preview();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await load('renderer');
    await row().getByRole('button').click();
    assert.equal(await row().getByRole('progressbar').getAttribute('aria-valuenow'), '100');
    await row().getByRole('switch').check();
    rows = await data();
    assert.equal(rows[0].active, true);
    assert.equal(rows[0].completed, 40);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    pass('native select and component controls at ' + width + 'px', {
      tags: 'design,mobile',
      completed: 40,
      active: true,
    });
  }
  assert.deepEqual(errors, []);
  await writeFile(output + '/functional.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
