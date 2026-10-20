import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connectBrowserForVerification } from './browser-session.mjs';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/navigation/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await connectBrowserForVerification();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const results = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log(scenario, observed); };
const gridReady = () => page.locator('.grid-preview .OwpDataGrid-root').waitFor();
const query = () => new URL(page.url()).searchParams;

try {
  await page.goto(origin + '/?package=datagrid');
  await page.locator('.getting-started').waitFor();
  assert.equal(query().get('package'), 'datagrid');
  assert.equal(query().get('sample'), 'getting-started');
  assert.equal(await page.locator('.workspace-heading h1').textContent(), '시작');
  pass('package-only entry opens the default sample', { package: query().get('package'), sample: query().get('sample') });

  const sidebar = page.locator('.desktop-sidebar');
  const rowGroup = sidebar.locator('.nav-category').filter({ has: page.getByRole('button', { name: '행 관리 (Row management)', exact: true }) });
  const exportGroup = sidebar.locator('.nav-category').filter({ has: page.getByRole('button', { name: '내보내기 (Export)', exact: true }) });
  const exampleIds = group => group.locator('.nav-item').evaluateAll(links => links.map(link => new URL(link.href).searchParams.get('sample')));
  assert.equal(await sidebar.locator('.nav-category').count(), 12);
  assert.equal(await sidebar.locator('.nav-item').count(), 47);
  assert.deepEqual(await exampleIds(rowGroup), ['row-actions', 'row-insertion', 'row-deletion', 'reordering', 'ref-move', 'ref-data', 'ref-changes']);
  assert.deepEqual(await exampleIds(exportGroup), ['excel', 'excel-snapshot', 'span-export']);
  pass('DataGrid groups related controls and Ref APIs without losing examples', { groups: 12, samples: 47 });

  await rowGroup.getByRole('button').click();
  assert.equal(await rowGroup.locator('.nav-item').count(), 0);
  await sidebar.getByRole('textbox', { name: '예제 검색', exact: true }).fill('행 이동');
  assert.deepEqual(await exampleIds(rowGroup), ['reordering', 'ref-move']);
  await sidebar.getByRole('textbox', { name: '예제 검색', exact: true }).fill('');
  assert.equal(await rowGroup.locator('.nav-item').count(), 0);
  await rowGroup.getByRole('button').click();
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  assert.equal(await sidebar.getByRole('button', { name: 'Row management', exact: true }).count(), 1);
  assert.equal(await sidebar.getByRole('button', { name: 'Export', exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  pass('feature groups retain collapse, search and language switching', { search: ['reordering', 'ref-move'], translatedGroups: true });

  await page.goto(origin + '/?package=%40owp%2Fdatagrid&sample=auto-span');
  await gridReady();
  assert.equal(query().get('package'), 'datagrid');
  assert.equal(await page.locator('.workspace-heading h1').textContent(), '자동 행 병합');
  pass('scoped package and sample entry', { package: query().get('package'), sample: query().get('sample') });

  await page.goto(origin + '/?package=%40owp%2Fpdf');
  await page.getByRole('heading', { name: 'OwpPdf', exact: true }).waitFor();
  assert.equal(query().get('package'), 'pdf');
  assert.equal(query().has('sample'), false);
  pass('scoped planned package resolves independently of the default', { package: query().get('package'), sample: query().get('sample') });

  await page.goto(origin + '/?sample=editing&ref=docs#main-content');
  await gridReady();
  assert.equal(query().get('package'), 'datagrid');
  assert.equal(query().get('sample'), 'editing');
  await page.getByRole('button', { name: '패키지 선택', exact: true }).click();
  const packageItems = page.locator('[role="menuitem"][data-package]');
  assert.deepEqual((await packageItems.evaluateAll(items => items.map(item => item.dataset.package))).slice(0, 2), ['datagrid', 'charts']);
  for (const item of (await packageItems.all()).slice(2)) {
    assert.equal(await item.getAttribute('aria-disabled'), 'true');
    assert.match(await item.textContent(), /준비 중/);
  }
  await page.keyboard.press('End');
  assert.equal(await page.locator('[data-package="charts"]').evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Enter');
  await page.locator('.getting-started').waitFor();
  assert.equal(query().get('package'), 'charts');
  assert.equal(query().get('sample'), 'getting-started');
  assert.equal(query().get('ref'), 'docs');
  assert.equal(new URL(page.url()).hash, '#main-content');
  assert.equal(await page.locator('.grid-preview').count(), 0);
  pass('ready packages lead the menu and keyboard navigation skips disabled planned entries', { package: query().get('package'), ref: query().get('ref'), fragment: new URL(page.url()).hash });

  await page.goBack();
  await gridReady();
  assert.equal(await page.locator('.workspace-heading h1').textContent(), '셀 편집');
  assert.equal(query().get('sample'), 'editing');
  await page.goForward();
  await page.locator('.getting-started').waitFor();
  assert.equal(query().get('package'), 'charts');
  await page.reload();
  await page.locator('.getting-started').waitFor();
  pass('history and reload restore the selected playground', { backExample: 'editing', forwardPackage: query().get('package'), reloadedHeading: await page.locator('.workspace-heading h1').textContent() });

  await page.goto(origin + '/?package=pdf&ref=docs#main-content');
  await page.getByRole('heading', { name: 'OwpPdf', exact: true }).waitFor();
  await page.getByRole('button', { name: 'OwpDataGrid 보기', exact: true }).click();
  await page.locator('.getting-started').waitFor();
  const exampleLink = page.locator('.desktop-sidebar .nav-item').filter({ hasText: '자동 행 병합' });
  const href = new URL(await exampleLink.getAttribute('href'));
  assert.equal(href.searchParams.get('package'), 'datagrid');
  assert.equal(href.searchParams.get('sample'), 'auto-span');
  await exampleLink.click();
  await page.getByRole('heading', { name: '자동 행 병합', exact: true }).waitFor();
  assert.equal(query().get('ref'), 'docs');
  assert.equal(new URL(page.url()).hash, '#main-content');
  pass('sample links include the package and retain other URL values', { package: query().get('package'), sample: query().get('sample'), ref: query().get('ref') });

  await page.goto(origin + '/?package=unknown&sample=unknown');
  await page.locator('.getting-started').waitFor();
  assert.equal(query().get('package'), 'datagrid');
  assert.equal(query().get('sample'), 'getting-started');
  pass('unknown route opens a usable default', { package: query().get('package'), sample: query().get('sample') });

  await page.goto(origin + '/?sample=overview');
  await gridReady();
  await page.locator('.grid-preview input[type=checkbox]').nth(1).check();
  await page.getByRole('button', { name: '패키지 선택', exact: true }).click();
  await page.locator('[role=menuitem][data-package=datagrid]').click();
  assert.match(await page.locator('.grid-status-bar').textContent(), /선택 1/);
  pass('reselecting the current package preserves working selection', { selected: 1 });

  const resource = await page.request.get(origin + '/packages.json');
  assert.equal(resource.status(), 200);
  const metadata = await resource.json();
  assert.equal(metadata.packages.length, 9);
  assert.equal(metadata.packages.find(entry => entry.id === 'datagrid').status, 'ready');
  assert.equal(metadata.packages.find(entry => entry.id === 'pdf').status, 'planned');
  pass('published package resources match route readiness', { count: metadata.packages.length, datagrid: 'ready', pdf: 'planned' });

  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(new URL('report.json', output), JSON.stringify({ results, errors }, null, 2));
  console.log('PASS', results.length, 'navigation scenarios');
} finally {
  await browser.close();
}
