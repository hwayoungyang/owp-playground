import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/api-expansion/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const results = []; const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario, observed); };
async function load(id) { await page.goto(`${origin}/?package=datagrid&sample=${id}`); await page.locator('.grid-preview .OwpDataGrid-root').first().waitFor(); }
async function preview() { await page.getByRole('tab', { name: '예제', exact: true }).click(); }
async function data() { await page.getByRole('tab', { name: '데이터', exact: true }).click(); await page.waitForFunction(() => document.querySelector('.code-scroll code')?.textContent.startsWith('[')); return await readGridData(page); }
async function action(name) { await page.locator('.example-controls').getByRole('button', { name, exact: true }).click(); }
async function result(api) {
  await page.getByRole('tab', { name: /^이벤트/ }).click();
  const event = page.locator('.event-list details').filter({ has: page.locator('.event-name').filter({ hasText: new RegExp(`^${api}$`) }) }).first();
  await event.waitFor({ state: 'attached' });
  const value = JSON.parse(await event.locator('pre').textContent());
  await preview();
  return value;
}
async function select(index) { await page.locator('.grid-preview input[type=checkbox]').nth(index + 1).check(); }
async function edit(id, index, value) { const row = page.locator(`[data-owp-data-grid-row-key="string:${id}"]`); await row.locator('.OwpDataGrid-cell').nth(index).click(); await page.keyboard.press('Enter'); await row.locator('input:not([type=checkbox])').fill(value); await page.keyboard.press('Enter'); }
async function settle() { await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished)); }); }

try {
  await load('row-insertion'); await settle();
  const alignment = await page.evaluate(() => ({ divider: document.querySelector('.brand-divider').getBoundingClientRect().right, navigation: document.querySelector('.desktop-sidebar').getBoundingClientRect().right }));
  assert.ok(Math.abs(alignment.divider - alignment.navigation) < 1, JSON.stringify(alignment));
  await page.getByRole('button', { name: '패키지 선택', exact: true }).click();
  const current = page.locator('[role=menuitem][aria-current=true]');
  assert.equal(await current.getAttribute('data-package'), 'datagrid');
  assert.ok((await current.textContent()).includes('@owp/datagrid'));
  await page.keyboard.press('Escape');
  pass('header boundary and selected npm package', alignment);

  await action('상단에 추가'); let rows = (await data()).rows;
  const firstAdded = rows[0].id; assert.notEqual(firstAdded, 'task-1'); assert.equal(rows[1].id, 'task-1');
  await preview(); await select(rows.findIndex(row => row.id === 'task-3')); await action('선택 행 다음에 추가');
  rows = (await data()).rows; const targetIndex = rows.findIndex(row => row.id === 'task-3');
  assert.notEqual(rows[targetIndex + 1].id, 'task-4'); assert.equal(rows[targetIndex + 2].id, 'task-4');
  await preview(); await action('하단에 추가'); rows = (await data()).rows;
  assert.equal(rows.length, 15); assert.equal(rows.at(-2).id, 'task-12');
  pass('add rows at top, after an existing row and bottom', { rows: rows.length, afterTarget: targetIndex + 1 });

  await load('row-deletion'); await select(0); await action('선택 행 삭제');
  assert.equal((await data()).totalRows, 11); await preview(); await action('삭제 복구');
  rows = (await data()).rows; assert.equal(rows.length, 12); assert.equal(rows[0].id, 'task-1');
  await preview(); await action('새 행 추가'); assert.equal((await data()).totalRows, 13);
  await preview(); await action('새 행 취소'); assert.equal((await data()).totalRows, 12);
  pass('soft delete, restore and discard added rows', { restoredRows: 12 });

  await load('ref-data'); await select(0); await select(1); await action('선택 행 완료 처리');
  rows = (await data()).rows;
  assert.ok(rows.slice(0, 2).every(row => row.completed === row.quantity));
  assert.ok(rows.slice(2).some(row => row.completed < row.quantity));
  await preview();
  await page.getByRole('textbox', { name: '프로젝트 필터', exact: true }).fill('웹 서비스'); await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.querySelectorAll('.grid-preview .OwpDataGrid-cell').length < 50);
  await action('필터 결과 완료 처리'); rows = (await data()).rows;
  assert.ok(rows.slice(0, 4).every(row => row.completed === row.quantity));
  assert.ok(rows.slice(4).some(row => row.completed < row.quantity));
  await preview(); await page.locator('.grid-preview input[type=checkbox]').nth(2).uncheck();
  await action('선택 행 확인');
  assert.equal(await page.locator('[data-owp-data-grid-row-key="string:task-1"]').evaluate(row => row.contains(document.activeElement)), true);
  await action('전체 행 완료 처리'); rows = (await data()).rows;
  assert.equal(rows.length, 12); assert.ok(rows.every(row => row.completed === row.quantity));
  pass('batch updates honor selected, filtered and all row scopes', { all: 12, filtered: 4, selected: 2 });

  await load('ref-focus'); const original = (await data()).rows[0].task; await preview(); await action('첫 작업명 변경');
  assert.notEqual((await data()).rows[0].task, original); await preview(); await action('마지막 행 보기'); assert.equal(await result('scrollToRow'), true);
  await action('첫 작업 셀 포커스');
  await page.waitForFunction(() => document.querySelector('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell:nth-child(2)')?.contains(document.activeElement));
  const focused = await page.evaluate(() => document.querySelector('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell:nth-child(2)')?.contains(document.activeElement));
  assert.equal(focused, true); assert.equal(await result('focusCell'), true);
  await action('편집 확정'); assert.equal(await result('commitEditing'), true);
  pass('change values, scroll, focus and commit', { focused });

  await load('ref-move'); await select(2); await select(3); await action('선택 행 상단 이동');
  rows = (await data()).rows; assert.deepEqual(rows.slice(0, 2).map(row => row.id), ['task-3', 'task-4']);
  await preview(); await action('선택 행 하단 이동'); rows = (await data()).rows; assert.deepEqual(rows.slice(-2).map(row => row.id), ['task-3', 'task-4']);
  await load('ref-move'); await select(5); await action('한 행 상단 이동'); assert.equal((await data()).rows[0].id, 'task-6');
  pass('atomic multi-row movement and single-row movement', { singleTop: 'task-6' });

  await load('ref-changes'); await edit('task-1', 1, '검증용 변경');
  await page.waitForFunction(() => document.querySelector('.grid-status-bar')?.textContent.includes('변경 1'));
  await action('변경 확정');
  await page.waitForFunction(() => document.querySelector('.grid-status-bar')?.textContent.includes('변경 0'));
  await edit('task-2', 1, '되돌릴 변경'); await action('변경 되돌리기'); assert.equal((await data()).rows[1].task, '화면 설계');
  pass('accept and reset working changes', { unsavedAfterApproval: false });

  await load('external-validation'); await action('메시지 1건 표시'); await action('검증 메시지 확인'); assert.equal((await result('getCellErrors')).length, 1);
  await action('메시지 2건 표시'); await action('검증 메시지 확인'); assert.equal((await result('getCellErrors')).length, 2);
  await action('전체 작업 검증'); const validation = await result('validate'); assert.equal(validation.valid, false); assert.equal(validation.errors.length, 2);
  await action('검증 메시지 전체 해제'); await action('검증 메시지 확인'); assert.equal((await result('getCellErrors')).length, 0);
  pass('external validation messages and clearing', { errors: validation.errors.length, afterClear: 0 });

  await load('server-save'); assert.equal(await page.locator('.workspace-heading h1').textContent(), '변경 관리');
  await edit('task-1', 1, '기존 링크에서 확정한 작업'); await action('변경 확정');
  assert.equal((await data()).rows[0].task, '기존 링크에서 확정한 작업');
  pass('legacy server-save link opens working change tracking', { target: 'ref-changes' });

  await load('lazy-tree');
  await page.getByRole('combobox', { name: '하위 데이터', exact: true }).click();
  await page.getByRole('option', { name: '펼칠 때 불러오기', exact: true }).click();
  await page.locator('.grid-preview button[aria-expanded="false"]').first().click();
  await page.locator('[data-owp-data-grid-row-key="string:task-1"]').waitFor();
  assert.equal((await result('tree.loadChildren')).count, 4);
  assert.equal((await data()).totalRows, 7);
  pass('legacy lazy-tree link loads children on expansion', { loadedRows: 7 });

  await load('nested-tree'); await action('전체 접기'); await settle();
  let keys = await page.locator('.grid-preview .OwpDataGrid-row[data-owp-data-grid-row-key]').evaluateAll(items => [...new Set(items.map(item => item.getAttribute('data-owp-data-grid-row-key')))]);
  assert.equal(keys.length, 3); await action('전체 펼치기'); await settle();
  keys = await page.locator('.grid-preview .OwpDataGrid-row[data-owp-data-grid-row-key]').evaluateAll(items => [...new Set(items.map(item => item.getAttribute('data-owp-data-grid-row-key')))]);
  assert.ok(keys.length > 3); const nested = await data(); const nestedRows = nested.rows.flatMap(function flatten(row) { return [row, ...(row.children ?? []).flatMap(flatten)]; }); assert.equal(nested.totalRows, 3); assert.equal(nestedRows.length, 45); pass('controlled four-level tree expansion and nested API response', { collapsed: 3, roots: nested.totalRows, loaded: nestedRows.length });

  await load('selection-policy'); assert.equal(await page.locator('.OwpDataGrid-root input[type=checkbox]').first().isDisabled(), true);
  await action('새 행 추가'); const added = await result('addRow');
  const addedCheckbox = page.locator(`[data-owp-data-grid-row-key="string:${added.rowId}"] input[type=checkbox]`);
  assert.equal(await addedCheckbox.isEnabled(), true); await addedCheckbox.check();
  pass('select-all policy and selectable added rows', { headerDisabled: true, addedSelectable: true });

  await load('click-events'); await page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').nth(1).click();
  assert.equal((await result('onRowClick')).rowId, 'task-1');
  await page.getByRole('tab', { name: /^이벤트/ }).click(); assert.ok(await page.locator('.event-list summary').filter({ hasText: 'onCellClick' }).count());
  pass('native cell and row click callbacks', { rowId: 'task-1' });

  await load('excel-snapshot'); await action('데이터 미리보기'); assert.equal((await result('getExcelSnapshot')).count, 10000);
  await action('제외 항목 확인'); assert.ok(await result('getExcelExportWarnings'));
  await action('1만 행 읽기');
  await page.getByRole('button', { name: '1만 행 읽기', exact: true }).and(page.locator(':enabled')).waitFor();
  const batches = await result('createExcelExportSession'); assert.equal(batches.count, 10000); assert.ok(batches.batches > 1);
  pass('Excel snapshot, warnings and batch sessions', { rows: batches.count, batches: batches.batches });

  await load('detail-grid'); await page.locator('.grid-preview button[aria-expanded]').first().click();
  await page.locator('.detail-grid-content [data-owp-data-grid-row-key="string:task-1"]').waitFor(); await settle();
  const frames = await page.locator('.grid-preview .OwpDataGrid-scrollFrame').evaluateAll(items => items.map(item => ({ overflow: item.getAttribute('data-vertical-overflow'), gutter: Number.parseFloat(getComputedStyle(item).gridTemplateColumns.split(' ').at(-1)) })));
  assert.equal(frames[0].overflow, 'false'); assert.equal(frames[0].gutter, 0); assert.equal(frames[1].overflow, 'true'); assert.equal(frames[1].gutter, 24);
  const pendingDownload = page.waitForEvent('download'); await page.getByRole('button', { name: '상세 Excel 다운로드', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '다운로드', exact: true }).click();
  const downloaded = await pendingDownload; const path = new URL('detail.xlsx', output).pathname; await downloaded.saveAs(path);
  const { loadExcelJSBrowser } = await import('@owp/excel'); const ExcelJS = await loadExcelJSBrowser(); const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await readFile(path));
  const worksheet = workbook.worksheets[0]; const detailRows = [];
  worksheet.eachRow(row => {if ([40, 52, 64, 76].includes(row.getCell(4).value) && typeof row.getCell(1).value === 'string') detailRows.push(row.values);});
  assert.equal(detailRows.length, 4);
  pass('nested scrollbar isolation and independent detail Excel', { frames, excelRows: detailRows.length, filename: downloaded.suggestedFilename() });

  assert.deepEqual(errors, []); console.log('PASS', results.length, 'API scenarios');
} catch (error) { await page.screenshot({ path: new URL('interaction-failure.png', output).pathname }); throw error;
} finally { await writeFile(new URL('interaction-report.json', output), JSON.stringify({results, errors}, null, 2)); await browser.close(); }
