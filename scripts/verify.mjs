import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { loadExcelJSBrowser } from '@owp/excel';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('dialog', (dialog) => void dialog.accept());
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

async function load(id) {
  await page.goto(`${origin}/?sample=${id}`);
  await page.locator('.grid-preview .OwpDataGrid-root').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

async function waitStatus(text) {
  await page.waitForFunction((text) => document.querySelector('.grid-status-bar')?.textContent.includes(text), text);
}

async function edit(rowId, index, value) {
  const row = page.locator(`[data-owp-data-grid-row-key="string:${rowId}"]`);
  await row.locator('.OwpDataGrid-cell').nth(index).click();
  await page.keyboard.press('Enter');
  await row.locator('input:not([type="checkbox"])').fill(value);
  await page.keyboard.press('Enter');
}

async function choose(label, option) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

function pass(scenario, observed) { results.push({ scenario, observed, pass: true }); console.log(`PASS ${scenario}`, observed); }

async function exportRows(scope, expected, configureScope = true) {
  if (configureScope) await choose('Excel 내보내기 범위', scope);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '다운로드', exact: true }).click();
  const download = await pending;
  const filename = new URL(`export-${results.length}-${expected}.xlsx`, output);
  await download.saveAs(filename.pathname);
  const ExcelJS = await loadExcelJSBrowser();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filename));
  const worksheet = workbook.worksheets[0];
  const tasks = [];
  worksheet?.eachRow((row) => { if (['웹 서비스', '모바일 앱', '업무 시스템'].includes(String(row.getCell(1).value))) tasks.push(row.values); });
  assert.equal(tasks.length, expected);
  if (scope === '병합') assert.equal(worksheet.getCell('A3').isMerged, true);
  pass(`Excel ${scope}`, { actualDataRows: tasks.length, bytes: (await readFile(filename)).length, firstProjectMerged: worksheet.getCell('A3').isMerged, file: filename.pathname.split('/').at(-1) });
}

try {
  await load('overview');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await writeFile(new URL('axe-final.json', output), JSON.stringify(axe, null, 2));
  assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map((value) => value.id)));
  pass('accessible overview', { violations: axe.violations.length });

  await page.keyboard.press('Meta+k');
  await page.getByRole('textbox', { name: '예제 검색' }).fill('getCellRowSpanKey');
  assert.ok(await page.locator('.nav-item').count() > 0);
  await page.locator('.nav-item').first().click();
  assert.ok(page.url().includes('sample='));
  pass('keyboard search and sample navigation', { matches: await page.locator('.nav-item').count(), url: page.url() });

  await load('ref-data');
  await page.getByRole('tab', { name: '코드', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.code-scroll code')?.textContent.includes('applyTransaction'));
  const sourceDownload = page.waitForEvent('download');
  await page.locator('.code-toolbar').getByRole('button', { name: '다운로드', exact: true }).click();
  const sourceFile = await sourceDownload;
  const sourcePath = new URL('ref-data.tsx', output);
  await sourceFile.saveAs(sourcePath.pathname);
  assert.equal(await readFile(sourcePath, 'utf8'), await readFile(new URL('../src/playgrounds/datagrid/examples/ref-data.tsx', import.meta.url), 'utf8'));
  await choose('소스 파일 선택', 'server.ts');
  await page.waitForFunction(() => document.querySelector('.code-scroll code')?.textContent.includes('queryTasks'));
  pass('runtime snippet selection and exact download', { downloadedFile: sourceFile.suggestedFilename(), exactSource: true, supportingFile: 'server.ts' });

  await load('context-menu');
  await page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').nth(1).click({ button: 'right' });
  await page.getByRole('menuitem', { name: '작업 수정', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: '작업명' }).fill('수정된 범용 작업');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished)); });
  await page.screenshot({ path: new URL('row-dialog.png', output).pathname });
  await dialog.getByRole('button', { name: '변경 적용' }).click();
  await page.waitForFunction(() => document.querySelector('[data-owp-data-grid-row-key="string:task-1"]')?.textContent.includes('수정된 범용 작업'));
  pass('context menu dialog edit', { savedTask: '수정된 범용 작업' });

  await load('editing');
  await edit('task-1', 1, '샘플 작업 수정');
  await page.waitForFunction(() => document.querySelector('[data-owp-data-grid-row-key="string:task-1"]')?.textContent.includes('샘플 작업 수정'));
  await waitStatus('변경 1');
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  await page.locator('.code-scroll code').waitFor();
  const edited = await readGridData(page);
  assert.equal(edited.rows[0].task, '샘플 작업 수정');
  pass('edit and live data', { value: edited.rows[0].task, totalRows: edited.totalRows });

  await load('ref-changes');
  await edit('task-1', 1, '변경 확정 확인 1');
  await edit('task-2', 1, '변경 확정 확인 2');
  await waitStatus('변경 2');
  await page.getByRole('button', { name: '변경 확정', exact: true }).click();
  await waitStatus('변경 0');
  await page.locator('.preview-actions').getByRole('button', { name: '초기화', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-owp-data-grid-row-key="string:task-1"]')?.textContent.includes('진행 중'));
  pass('change approval and fixture reset', { changed: 2, afterReset: '진행 중' });

  await load('validation');
  await edit('task-1', 5, '999');
  await page.getByRole('button', { name: '입력 검증', exact: true }).click();
  await page.locator('[data-owp-data-grid-validation-column-id="completed"]').waitFor();
  assert.equal(await page.locator('[data-owp-data-grid-validation-column-id]').count(), 1);
  pass('numeric validation', { plan: 40, input: 999, errorCount: 1 });

  await load('row-actions');
  await page.locator('.grid-preview').getByRole('button', { name: '새 행 추가', exact: true }).click();
  await waitStatus('13행');
  await page.locator('.grid-preview input[type="checkbox"]').nth(1).check();
  await page.locator('.OwpDataGrid-rowEditToolbar').getByRole('button', { name: '삭제', exact: true }).click();
  await waitStatus('12행');
  await page.locator('.OwpDataGrid-rowEditToolbar').getByRole('button', { name: '삭제 복구', exact: true }).click();
  await waitStatus('13행');
  pass('row add/delete/restore', { before: 12, afterAdd: 13, afterDelete: 12, afterRestore: 13 });

  await load('auto-span');
  await page.locator('.grid-preview input[type="checkbox"]').nth(1).check();
  await waitStatus('선택 1');
  await page.locator('.grid-preview input[type="checkbox"]').nth(2).check();
  await waitStatus('선택 2');
  pass('automatic row spans retain individual row selection', { selectedRows: 2, totalRows: 12 });

  await load('detail-grid');
  await page.locator('.grid-preview').getByRole('button', { name: '펼치기', exact: true }).first().click();
  await page.locator('.grid-preview .OwpDataGrid-root').nth(1).getByText('요구사항 분석', { exact: true }).waitFor();
  await page.screenshot({ path: new URL('detail-expanded.png', output).pathname });
  pass('settled nested detail', { nestedGrids: await page.locator('.grid-preview .OwpDataGrid-root').count() });

  await load('excel');
  await page.locator('.grid-preview input[type="checkbox"]').nth(1).check();
  await page.locator('.grid-preview input[type="checkbox"]').nth(2).check();
  await exportRows('선택 행', 2);
  await exportRows('전체 행', 12);
  await exportRows('현재 표시 행', 12);
  await page.getByRole('button', { name: '설정 열기', exact: true }).click();
  await page.getByLabel('컬럼 필터 표시').check();
  await page.getByRole('button', { name: '설정 닫기' }).click();
  await page.getByRole('textbox', { name: '프로젝트 필터', exact: true }).fill('웹 서비스');
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.querySelectorAll('.grid-preview [data-owp-data-grid-row-key^="string:task-"]').length === 4);
  await exportRows('현재 표시 행', 4);
  await exportRows('전체 행', 12);
  await load('span-export');
  await exportRows('병합', 12, false);

  await load('large-data');
  await choose('생성할 데이터 건수', '1,000,000행');
  await page.getByRole('button', { name: '데이터 생성', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await waitStatus('0행');
  assert.equal(await page.locator('.grid-preview [data-owp-data-grid-row-key^="string:task-"]').count(), 0);
  pass('clear body before generation and cancel', { remainingRows: 0 });
  await page.getByRole('button', { name: '데이터 생성', exact: true }).click();
  await waitStatus('1,000,000행');
  const virtualRows = await page.locator('.grid-preview .OwpDataGrid-row').count();
  assert.ok(virtualRows < 100);
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  await page.locator('.code-scroll code').waitFor();
  const large = await readGridData(page);
  assert.equal(large.totalRows, 1000000); assert.equal(large.rows.length, 100);
  pass('million row dataset', { totalRows: large.totalRows, virtualRows, displayedJsonRows: large.rows.length });
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: new URL('interaction-failure.png', output).pathname });
  console.log('Failure surface', (await page.locator('body').innerText()).slice(-1500));
  throw error;
} finally {
  await writeFile(new URL('interaction-report.json', output), JSON.stringify({ results, browserErrors: errors }, null, 2));
  await browser.close();
}
