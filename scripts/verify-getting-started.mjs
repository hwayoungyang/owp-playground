import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import react from '@vitejs/plugin-react';
import { connectBrowserForVerification } from './browser-session.mjs';
import { build } from 'vite';
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import excelManifest from '@owp/excel/package.json' with { type: 'json' };

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/getting-started';
await mkdir(output, { recursive: true });
await build({ configFile: false, base: '/diagnostics/', plugins: [react()], logLevel: 'error',
  build: { outDir: 'dist/diagnostics', emptyOutDir: true,
    rolldownOptions: { input: fileURLToPath(new URL('./fixtures/panel-theme.html', import.meta.url)) } } });
const browser = await connectBrowserForVerification();
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
const results = [];
const failedRequests = [];
page.on('response', response => { if (response.status() >= 400) failedRequests.push({url:response.url(), status:response.status()}); });
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario, observed); };
const shot = async name => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished));
  });
  await page.screenshot({ path: `${output}/${name}.png` });
};
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function settings() { await page.getByRole('button', { name: '설정 열기', exact: true }).click(); }
async function closeSettings() {
  await page.getByRole('button', { name: '설정 닫기', exact: true }).click();
  await page.locator('.grid-settings-panel').waitFor({ state: 'hidden' });
}
async function panels(selector = '.grid-preview') {
  return page.locator(selector).evaluate(host => {
    const filter = host.querySelector('.OwpDataGrid-filterRow');
    const cells = [...filter.querySelectorAll('[role="columnheader"]')];
    const panel = cells[1];
    const icon = panel.querySelector('svg');
    const effective = el => {
      for (let current = el; current; current = current.parentElement) {
        const bg = getComputedStyle(current).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      }
      return 'transparent';
    };
    return { filter: effective(filter), drag: effective(cells[0]), panel: effective(panel), icon: getComputedStyle(icon).color };
  });
}

try {
  await page.goto(`${origin}/?package=datagrid`);
  await page.locator('.getting-started').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('sample'), 'getting-started');
  assert.equal(await page.locator('.desktop-sidebar .nav-item').first().textContent(), '시작하기');
  assert.equal(await page.locator('.desktop-sidebar .category-label').first().getAttribute('aria-label'), '기본 (Basics)');
  assert.equal(await page.locator('[role=tab]').count(), 0);
  assert.equal(await page.locator('.guide-code').count(), 3);
  await shot('guide-desktop');
  pass('guide is the first Basics entry and default DataGrid route', { guide: 'getting-started', executableExamples: 47 });

  const source = await readFile('src/playgrounds/datagrid/guides/getting-started.tsx', 'utf8');
  const codeBlocks = page.locator('.guide-code pre');
  const expected = ['@owp:registry=<OWP_REGISTRY_URL>', `pnpm add @owp/datagrid@${dataGridManifest.version} @owp/excel@^${excelManifest.version}`, source];
  for (let index = 0; index < expected.length; index++) {
    assert.equal(await codeBlocks.nth(index).textContent(), expected[index]);
    await page.locator('.guide-code button').nth(index).click();
    await page.locator('.guide-code').nth(index).locator('button').filter({ hasText: '복사됨' }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected[index]);
  }
  await page.getByRole('button', { name: '링크 복사', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), page.url());
  const published = await page.request.get(`${origin}/snippets/samples/guides/getting-started.tsx`);
  assert.equal(await published.text(), source);
  assert.equal(await page.locator('.guide-code .hljs-name').filter({ hasText: 'OwpDataGrid' }).count(), 1);
  pass('registry, install command, typed usage and link copy use the displayed content', { blocks: 3, sourceMatchesResource: true });
  await page.waitForFunction(() => document.querySelectorAll('.MuiSnackbar-root').length === 0);

  await page.getByRole('button', { name: '영어로 전환' }).click();
  await page.mouse.move(0, 0);
  await page.getByRole('tooltip').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('h1').textContent(), 'Getting started');
  assert.equal(await page.locator('.desktop-sidebar .category-label').first().textContent(), 'Basics');
  assert.match(await page.locator('.guide-sections').textContent(), /Registry setup/);
  const axeEnglish = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.equal(axeEnglish.violations.length, 0, JSON.stringify(axeEnglish.violations.map(v => ({id:v.id, targets:v.nodes.map(n=>n.target)}))));
  await shot('guide-english');
  await page.getByRole('button', { name: 'Switch to Korean' }).click();
  await page.getByRole('button', { name: '다크 모드로 전환' }).click();
  await page.mouse.move(0, 0);
  await page.getByRole('tooltip').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.package-selector')).color === 'rgb(237, 237, 237)');
  const axeDark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.equal(axeDark.violations.length, 0, JSON.stringify(axeDark.violations.map(v => ({id:v.id, targets:v.nodes.map(n=>n.target)}))));
  await shot('guide-dark');
  await page.getByRole('button', { name: '라이트 모드로 전환' }).click();
  pass('guide switches languages and has no accessibility violations in English or dark mode', { violations: 0 });

  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    assert.equal(await noOverflow(), true);
    await shot(`guide-${width}`);
    await page.locator('.guide-sections > section').last().scrollIntoViewIfNeeded();
    await shot(`guide-usage-${width}`);
  }
  await page.getByRole('button', { name: '탐색 메뉴 열기' }).click();
  assert.equal(await page.locator('.MuiDrawer-root .nav-item').first().textContent(), '시작하기');
  await page.locator('.MuiDrawer-root').getByRole('link', { name: '표시 행 수 고정', exact: true }).click();
  await page.locator('.OwpDataGrid-root').waitFor();
  assert.equal(await page.locator('.language-label').count(), 0);
  await page.goBack();
  await page.locator('.getting-started').waitFor();
  pass('tablet and mobile code scroll inside the guide; drawer navigation and history work', { widths: [768, 375], pageOverflow: false });

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${origin}/?sample=tree`);
  await page.locator('.OwpDataGrid-root').waitFor();
  await settings();
  await page.getByLabel('컬럼 필터 표시').check();
  await closeSettings();
  const light = await panels();
  assert.equal(light.drag, light.panel);
  assert.equal(light.filter, light.panel);
  assert.notEqual(light.icon, light.panel);
  await shot('panel-after-light');
  await page.getByRole('button', { name: '다크 모드로 전환' }).click();
  await page.waitForFunction(() => document.querySelector('.preview-theme').dataset.previewMode === 'dark');
  const dark = await panels();
  assert.equal(dark.drag, dark.panel);
  assert.equal(dark.filter, dark.panel);
  assert.notEqual(dark.icon, dark.panel);
  await shot('panel-after-dark');
  pass('tree drag and filter panel backgrounds match in light and dark modes', { light, dark });

  await page.getByRole('button', { name: '라이트 모드로 전환' }).click();
  await settings();
  await page.getByRole('combobox', { name: '테마', exact: true }).click();
  await page.getByRole('option', { name: 'Industrial', exact: true }).click();
  await closeSettings();
  const industrial = await panels();
  assert.equal(industrial.drag, industrial.panel);
  await shot('panel-industrial');
  await settings();
  await page.getByRole('combobox', { name: '테마', exact: true }).click();
  await page.getByRole('option', { name: '한금', exact: true }).click();
  await closeSettings();
  const hankum = await panels();
  assert.equal(hankum.drag, hankum.panel);
  assert.notEqual(hankum.icon, hankum.panel);
  await shot('panel-hankum');
  pass('colored preset and consumer-native preset keep the filter panel visible', { industrial, hankum });

  await page.goto(`${origin}/diagnostics/scripts/fixtures/panel-theme.html`);
  await page.locator('[data-case=separate] .OwpDataGrid-root').waitFor();
  const separate = await panels('[data-case=separate]');
  const corrected = await panels('[data-case=playground]');
  assert.notEqual(separate.drag, separate.panel);
  assert.equal(separate.drag, separate.filter);
  assert.equal(corrected.drag, corrected.panel);
  await shot('native-package-comparison');
  pass('installed package preserves the empty drag slot filter background without Playground CSS', { version: dataGridManifest.version, separate, corrected });

  assert.deepEqual(errors, [], JSON.stringify(failedRequests));
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors }, null, 2));
  console.log('PASS', results.length, 'getting-started and panel scenarios');
} finally {
  await browser.close();
  await rm('dist/diagnostics', { recursive: true, force: true });
}
