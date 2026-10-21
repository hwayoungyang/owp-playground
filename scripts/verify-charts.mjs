import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { connectBrowserForVerification } from './browser-session.mjs';
import { chartDataText, readChartData } from './chart-data.mjs';
import { verifyChartInteractions } from './chart-interactions.mjs';
import { verifyHistogramZoom } from './histogram-zoom-regression.mjs';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/charts/browser/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await connectBrowserForVerification();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await context.addInitScript(() => {
  window.chartProbe = null;
  const paths = new WeakMap();
  const prototype = CanvasRenderingContext2D.prototype;
  for (const name of ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'fillText']) {
    const original = prototype[name];
    prototype[name] = function (...args) {
      if (this.canvas.closest('.chart-preview')) {
        if (name === 'clearRect') this.canvas.dataset.histogramLabels = '[]';
        if (name === 'fillText' && /^-?\d+\.\d–-?\d+\.\d$/.test(String(args[0]))) {
          const labels = JSON.parse(this.canvas.dataset.histogramLabels ?? '[]');
          labels.push(String(args[0]));
          this.canvas.dataset.histogramLabels = JSON.stringify(labels);
        }
      }
      if (window.chartProbe) {
        const index = [...document.querySelectorAll('.chart-preview canvas')].indexOf(this.canvas);
        if (index >= 0) {
          if (name === 'clearRect') window.chartProbe[index] = { strokes: [], texts: [] };
          if (name === 'beginPath') paths.set(this, []);
          if (name === 'moveTo' || name === 'lineTo') paths.get(this)?.push(args);
          const frame = window.chartProbe[index];
          if (frame && name === 'stroke' && this.getLineDash().length) {
            frame.strokes.push({ points: paths.get(this), dash: this.getLineDash() });
          }
          if (frame && name === 'fillText') frame.texts.push({ text: args[0], color: this.fillStyle, font: this.font });
        }
      }
      return original.apply(this, args);
    };
  }
});

const page = await context.newPage();
const results = [];
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario); };
const open = async (id) => {
  await page.goto(`${origin}/?package=charts&sample=${id}`);
  await page.locator('.chart-status').waitFor();
  await page.locator('.chart-preview canvas, .chart-preview .OwpDataGrid-root').first().waitFor();
};
const screenshot = (name) => page.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: true });
try {
  const response = await context.request.get(`${origin}/catalogs/charts.json`);
  assert.equal(response.status(), 200);
  const { samples } = await response.json();
  assert.equal(samples.filter((sample) => sample.kind === 'chart').length, 97);
  assert.equal(samples.filter((sample) => sample.kind === 'guide').length, 1);
  for (const sample of samples) {
    await page.goto(`${origin}/?package=charts&sample=${sample.id}`);
    await page.getByRole('heading', { name: sample.title, exact: true }).waitFor();
    if (sample.kind === 'guide') await page.locator('.guide-sections').waitFor();
    else {
      await page.locator('.chart-preview canvas, .chart-preview .OwpDataGrid-root').first().waitFor();
      await page.getByRole('tab', { name: '데이터', exact: true }).click();
      assert.ok((await readChartData(page)).series.length > 0, sample.id);
      assert.equal(await page.locator('[role=tabpanel]:not([hidden]) table').count(), 0, sample.id);
      await page.getByRole('tab', { name: '코드', exact: true }).click();
      await page.waitForFunction(() => /ChartFrame|CoreChart|ChartCanvas|Owp(?:Area|BoxPlot|Treemap|Radar|Radial|Heatmap|Live)Chart/.test(document.querySelector('pre')?.textContent ?? ''));
    }
    const source = await context.request.get(`${origin}/snippets/playgrounds/charts/${sample.source}`);
    assert.equal(source.status(), 200, sample.id);
    const publishedSource = await source.text();
    const localSource = await readFile(new URL(`../src/playgrounds/charts/${sample.source}`, import.meta.url), 'utf8');
    assert.equal(publishedSource, localSource, `${sample.id}: published snippet must match the executable source`);
    assert.match(publishedSource, /<(?:ChartFrame|CoreChart|ChartCanvas|Owp(?:Area|BoxPlot|Treemap|Radar|Radial|Heatmap|Live)Chart)\b/, sample.id);
    assert.doesNotMatch(publishedSource, /NativeCanvas|NativeLegend/, sample.id);
    console.log('verified source', sample.id);
  }
  pass('98 routes, data, source tabs and published snippets', { examples: 97, guides: 1 });

  await verifyChartInteractions(page, origin, pass);
  await verifyHistogramZoom(page, open, pass);

  await open('bar');
  await page.getByRole('slider', { name: '표시할 월 수', exact: true }).press('Home');
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  assert.equal((await readChartData(page)).labels.length, 3);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await page.getByRole('slider', { name: '표시할 월 수', exact: true }).waitFor();
  assert.equal(await page.getByRole('slider', { name: '표시할 월 수', exact: true }).inputValue(), '12');
  pass('month range changes data and resets', { minimumRows: 3, reset: 12 });

  await open('live');
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  const liveData = () => chartDataText(page);
  const initialLive = await liveData();
  await page.waitForFunction(before => document.querySelector('[role=tabpanel]:not([hidden]) pre code')?.textContent !== before, initialLive);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await page.getByRole('button', { name: '일시정지', exact: true }).click();
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  const pausedLive = await liveData();
  await page.waitForTimeout(1300);
  assert.equal(await liveData(), pausedLive);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await page.getByRole('slider', { name: '표시할 데이터 수', exact: true }).press('End');
  for (let index = 0; index < 65; index += 1) await page.getByRole('button', { name: '데이터 추가', exact: true }).click();
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  assert.equal((await readChartData(page)).labels.length, 60);
  const appendedLive = await liveData();
  assert.notEqual(appendedLive, pausedLive);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await page.getByRole('button', { name: '다시 시작', exact: true }).click();
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  await page.waitForFunction(before => document.querySelector('[role=tabpanel]:not([hidden]) pre code')?.textContent !== before, appendedLive);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await page.getByRole('button', { name: '일시정지', exact: true }).waitFor();
  assert.equal(await page.getByRole('slider', { name: '표시할 데이터 수', exact: true }).inputValue(), '30');
  pass('live append, pause, resume, bounded window and reset', { maximumPoints: 60, resetPoints: 30 });

  for (const id of ['gauge', 'doughnut']) {
    await open(id);
    const selector = `.chart-canvas-${id}`;
    for (const [width, height] of [[2048, 1288], [1280, 900], [1280, 768], [1280, 600], [768, 720], [375, 667]]) {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(selector => {
        const main = document.querySelector('main');
        const plot = document.querySelector(selector)?.getBoundingClientRect();
        const canvas = document.querySelector(`${selector} canvas`)?.getBoundingClientRect();
        return plot && canvas && main.scrollHeight <= main.clientHeight + 1 && Math.abs(canvas.width - plot.width) <= 1 && canvas.bottom <= plot.bottom + 1;
      }, selector);
      const fit = await page.evaluate(selector => {
        const main = document.querySelector('main');
        const plot = document.querySelector(selector).getBoundingClientRect();
        const status = document.querySelector('.chart-status').getBoundingClientRect();
        const canvas = document.querySelector(`${selector} canvas`).getBoundingClientRect();
        return { overflow: main.scrollHeight - main.clientHeight, height: plot.height, bottom: plot.bottom, statusTop: status.top, canvasBottom: canvas.bottom };
      }, selector);
      assert.ok(fit.overflow <= 1, JSON.stringify({ id, width, height, fit }));
      assert.ok(fit.height >= 160 && fit.height <= 420);
      assert.ok(fit.canvasBottom <= fit.bottom + 1 && fit.bottom <= fit.statusTop, JSON.stringify({ id, width, height, fit }));
      await screenshot(`${id}-fit-${width}-${height}`);
    }
    pass(`${id} fits the available viewport without clipping controls or overflowing`, { widths: [2048, 1280, 768, 375], minimumHeight: 600 });
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  await open('linked');
  await page.waitForFunction(() => document.querySelectorAll('[role=slider]').length === 4);
  await page.evaluate(() => { window.chartProbe = {}; });
  const hoverLinked = async () => {
    await page.mouse.move(240, 150);
    const bounds = await page.locator('.chart-panel canvas').first().boundingBox();
    assert.ok(bounds);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForFunction(() => window.chartProbe[0] && window.chartProbe[1]);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return page.evaluate(() => window.chartProbe);
  };
  const crosshairCount = (frame) => frame.strokes.filter(({ points }) => points?.length === 2 && points[0][0] === points[1][0] && Math.abs(points[0][1] - points[1][1]) > 100).length;
  const juneTooltips = () => page.locator('body > [role="tooltip"][aria-hidden="false"]').filter({ hasText: '6월' });
  const synced = await hoverLinked();
  assert.equal(crosshairCount(synced[0]), 1);
  assert.equal(crosshairCount(synced[1]), 1);
  await juneTooltips().nth(1).waitFor();
  assert.equal(await juneTooltips().count(), 2);
  await screenshot('linked-crosshair-tooltip');
  await page.getByRole('switch', { name: 'Crosshair 동기화', exact: true }).uncheck();
  const noCrosshair = await hoverLinked();
  assert.equal(crosshairCount(noCrosshair[1]), 0);
  await juneTooltips().nth(1).waitFor();
  assert.equal(await juneTooltips().count(), 2);
  await page.getByRole('switch', { name: 'Crosshair 동기화', exact: true }).check();
  await page.getByRole('switch', { name: 'Tooltip 동기화', exact: true }).uncheck();
  const noTooltip = await hoverLinked();
  assert.equal(crosshairCount(noTooltip[1]), 1);
  await page.waitForFunction(() => [...document.querySelectorAll('body > [role="tooltip"][aria-hidden="false"]')].filter((tip) => tip.textContent.includes('6월')).length === 1);
  assert.equal(await juneTooltips().count(), 1);
  await writeFile(new URL('linked-canvas-probe.json', output), JSON.stringify({ synced, noCrosshair, noTooltip }, null, 2));
  await page.evaluate(() => { window.chartProbe = null; });
  pass('crosshair and tooltip sync independently by matching month', { month: '6월', crosshair: 'both', tooltip: 'both', independentToggles: true });

  await open('percent-stacked');
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  const normalized = await readChartData(page);
  for (const [index] of normalized.labels.entries()) {
    const total = normalized.series.reduce((sum, series) => sum + Number(series.values[index]), 0);
    assert.ok(Math.abs(total - 100) < 0.01);
  }
  pass('normalized stacks total 100 percent', { rows: 12 });

  await open('states');
  await page.getByRole('button', { name: '로딩 중', exact: true }).click();
  assert.equal(await page.locator('.chart-canvas [aria-busy]').getAttribute('aria-busy'), 'true');
  await page.getByRole('button', { name: '데이터 없음', exact: true }).click();
  assert.match(await page.locator('.chart-canvas').getByRole('status').filter({ hasText: '표시할 차트 데이터' }).textContent(), /표시할 차트 데이터/);
  await page.getByRole('button', { name: '조회 실패', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.locator('canvas').waitFor();
  pass('loading, empty, error and retry', { retry: 'ready' });

  await open('sparkline');
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  const previousSpark = await readChartData(page);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await page.getByRole('button', { name: '데이터 갱신', exact: true }).click();
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  const nextSpark = await readChartData(page);
  assert.equal(nextSpark.series.length, 6);
  assert.equal(nextSpark.labels.length, 5);
  assert.notDeepEqual(previousSpark.series, nextSpark.series);
  await open('detail-chart');
  await page.locator('.OwpDataGrid-root button[aria-expanded="false"]').first().click();
  await page.locator('.chart-detail canvas').waitFor();
  await screenshot('detail-expanded');
  pass('grid sparkline updates and detail expansion', { series: 6, points: 5, detail: true });

  await open('export-ref');
  await page.getByRole('button', { name: 'PNG 미리보기', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.waitForFunction(() => { const image = document.querySelector('.chart-png-preview'); return image?.complete && image.naturalWidth > 0; });
  await screenshot('png-preview');
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  const externalDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG 저장', exact: true }).click();
  const downloaded = await externalDownload;
  const png = await readFile(await downloaded.path());
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  await downloaded.saveAs(new URL('export-ref.png', output).pathname);
  await open('png-export');
  await page.getByRole('button', { name: '차트 메뉴', exact: true }).click();
  const nativeDownload = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: /PNG/ }).click();
  const nativePng = await nativeDownload;
  assert.equal((await readFile(await nativePng.path())).subarray(1, 4).toString(), 'PNG');
  await nativePng.saveAs(new URL('native-export.png', output).pathname);
  pass('native and exportRef PNG downloads and preview', { bytes: png.length });

  await open('linked');
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  await page.getByRole('heading', { name: 'Crosshair and tooltip sync', exact: true }).waitFor();
  assert.equal(await page.locator('main').evaluate((element) => /[가-힣]/.test(element.innerText)), false);
  for (const sample of samples) {
    await page.goto(`${origin}/?package=charts&sample=${sample.id}`);
    await page.locator(sample.kind === 'guide' ? '.guide-sections' : '.chart-status').waitFor();
    if (sample.kind === 'chart') await page.locator('.chart-preview canvas, .chart-preview .OwpDataGrid-root').first().waitFor();
    await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    const visibleText = await page.locator('main').evaluate((element) => { const copy = element.cloneNode(true); for (const code of copy.querySelectorAll('pre')) code.remove(); return copy.textContent; });
    assert.equal(/[가-힣]/.test(visibleText), false, `Untranslated visible text in ${sample.id}: ${visibleText}`);
  }
  pass('all 95 English pages', { pages: 95 });
  await open('linked');
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await screenshot('english-dark-linked');
  await page.setViewportSize({ width: 375, height: 900 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await screenshot('english-dark-mobile');
  pass('English, dark theme and mobile containment', { width: 375 });
  assert.deepEqual(errors, []);
} catch (error) {
  await screenshot('failure');
  throw error;
} finally {
  await writeFile(new URL('report.json', output), JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
