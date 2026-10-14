import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/navigation/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
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
  assert.equal(await page.locator('.sample-heading h1').textContent(), '시작');
  pass('package-only entry opens the default sample', { package: query().get('package'), sample: query().get('sample') });

  await page.goto(origin + '/?package=%40owp%2Fdatagrid&sample=auto-span');
  await gridReady();
  assert.equal(query().get('package'), 'datagrid');
  assert.equal(await page.locator('.sample-heading h1').textContent(), '자동 행 병합');
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
  await page.locator('[role="menuitem"][data-package="pdf"]').click();
  await page.getByRole('heading', { name: 'OwpPdf', exact: true }).waitFor();
  assert.equal(query().get('package'), 'pdf');
  assert.equal(query().has('sample'), false);
  assert.equal(query().get('ref'), 'docs');
  assert.equal(new URL(page.url()).hash, '#main-content');
  assert.equal(await page.locator('.grid-preview').count(), 0);
  pass('package menu changes route and clears the previous sample', { package: query().get('package'), ref: query().get('ref'), fragment: new URL(page.url()).hash, gridCount: await page.locator('.grid-preview').count() });

  await page.goBack();
  await gridReady();
  assert.equal(await page.locator('.sample-heading h1').textContent(), '셀 편집');
  assert.equal(query().get('sample'), 'editing');
  await page.goForward();
  await page.getByRole('heading', { name: 'OwpPdf', exact: true }).waitFor();
  assert.equal(query().get('package'), 'pdf');
  await page.reload();
  await page.getByRole('heading', { name: 'OwpPdf', exact: true }).waitFor();
  pass('history and reload restore the selected playground', { backSample: 'editing', forwardPackage: query().get('package'), reloadedHeading: await page.locator('.package-heading h1').textContent() });

  await page.getByRole('button', { name: 'OwpDataGrid 보기', exact: true }).click();
  await page.locator('.getting-started').waitFor();
  const sampleLink = page.locator('.desktop-sidebar .nav-item').filter({ hasText: '자동 행 병합' });
  const href = new URL(await sampleLink.getAttribute('href'));
  assert.equal(href.searchParams.get('package'), 'datagrid');
  assert.equal(href.searchParams.get('sample'), 'auto-span');
  await sampleLink.click();
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
  assert.match(await page.locator('.preview-status').textContent(), /선택 1/);
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
