import assert from 'node:assert/strict';
import { readChartData } from './chart-data.mjs';

export async function verifyOwpLegendStates(page, open, record) {
  const legend = (name) => page.locator('.chart-preview').getByRole('button', { name, exact: true });
  const state = async (name, expected, scenario) => {
    const item = legend(name);
    await item.waitFor({ state: 'visible' });
    assert.equal(await item.count(), 1, `${scenario}: ${name} 범례가 정확히 하나 있어야 합니다`);
    await item.and(page.locator(`[aria-pressed="${expected}"]`)).waitFor({ state: 'visible' });
    assert.equal(await item.getAttribute('aria-pressed', {}), String(expected), `${scenario}: ${name}`);
  };
  for (const [id, toggleLabel, series, unaffected] of [
    ['divergent-forecast', '예측 시나리오 표시', ['기본 예측', '설비 증설 시나리오', '보수적 운영 시나리오'], '관측 생산량'],
    ['daily-combo', '일별 평균 표시', ['일별 평균'], '시간별 진동'],
  ]) {
    await open(id);
    const gate = page.getByRole('switch', { name: toggleLabel, exact: true });
    for (const name of [...series, unaffected]) await state(name, true, `${id}: initial`);
    for (let cycle = 0; cycle < 2; cycle++) {
      await gate.uncheck();
      for (const name of series) await state(name, false, `${id}: gate off ${cycle}`);
      await state(unaffected, true, `${id}: unaffected gate off ${cycle}`);
      await gate.check();
      for (const name of series) await state(name, true, `${id}: gate on ${cycle}`);
    }
    await legend(series[0]).click();
    await state(series[0], false, `${id}: manual hide`);
    for (let cycle = 0; cycle < 2; cycle++) {
      await gate.uncheck();
      for (const name of series) await state(name, false, `${id}: manual gate off ${cycle}`);
      await gate.check();
      await state(series[0], false, `${id}: preserve manual hide ${cycle}`);
      for (const name of series.slice(1)) await state(name, true, `${id}: restore siblings ${cycle}`);
      await state(unaffected, true, `${id}: unaffected manual gate ${cycle}`);
    }
    await record(`${id}-external-gate-preserves-manual-hide`, { series, cycles: 2, manuallyHidden: series[0] });
    await legend(series[0]).click();
    await state(series[0], true, `${id}: manual restore`);
  }
  await open('multi-series-pie');
  await page.getByRole('switch', { name: '항목별 범례', exact: true }).check();
  const outer = '2026 · 절단';
  const inner = '2025 · 절단';
  for (const name of [outer, inner]) await state(name, true, 'rings: initial');
  await legend(outer).click();
  await state(outer, false, 'rings: outer hidden');
  await state(inner, true, 'rings: inner unaffected');
  await legend(inner).click();
  await state(outer, false, 'rings: outer remains hidden');
  await state(inner, false, 'rings: inner hidden');
  await legend(outer).click();
  await state(outer, true, 'rings: outer restored');
  await state(inner, false, 'rings: inner remains hidden');
  await page.getByRole('slider', { name: '안쪽 비율', exact: true }).press('End');
  await state(outer, true, 'rings: outer after immutable data replacement');
  await state(inner, false, 'rings: inner after immutable data replacement');
  await record('independent-ring-items', { outerVisible: true, innerVisible: false, survivesControlChange: true });
  await legend(inner).click();
  await state(inner, true, 'rings: inner restored');
}

export async function verifyChartInteractions(page, origin, pass) {
  await page.addInitScript(() => {
    window.chartLabelProbe = [];
    const prototype = CanvasRenderingContext2D.prototype;
    const clear = prototype.clearRect;
    const text = prototype.fillText;
    prototype.clearRect = function (...args) {
      if (this.canvas.closest('.chart-preview')) window.chartLabelProbe = [];
      return clear.apply(this, args);
    };
    prototype.fillText = function (...args) {
      if (this.canvas.closest('.chart-preview')) {
        const point = this.getTransform().transformPoint({ x: args[1], y: args[2] });
        window.chartLabelProbe.push({ text: String(args[0]), x: point.x, y: point.y });
      }
      return text.apply(this, args);
    };
  });
  const settle = () => page.evaluate(async () => {
    for (let index = 0; index < 5; index++) await new Promise(requestAnimationFrame);
  });
  const open = async (id) => {
    await page.goto(`${origin}/?package=charts&sample=${id}`);
    await page.locator('.chart-preview canvas').waitFor();
    await settle();
  };

  await verifyOwpLegendStates(page, open, pass);

  for (const id of ['ranking', 'horizontal-bar', 'grouped-horizontal-bar', 'stacked-horizontal-bar', 'diverging-bar']) {
    await open(id);
    await page.getByRole('tab', { name: '데이터', exact: true }).click();
    const { labels } = await readChartData(page);
    await page.getByRole('tab', { name: '예제', exact: true }).click();
    await settle();
    const rows = await page.evaluate((labels) => {
      const canvas = document.querySelector('.chart-preview canvas');
      const bounds = canvas.getBoundingClientRect();
      const positions = new Map(window.chartLabelProbe.filter(({ text }) => labels.includes(text)).map((point) => [point.text, { ...point, x: point.x * bounds.width / canvas.width, y: point.y * bounds.height / canvas.height }]));
      return [...positions.values()].sort((left, right) => left.y - right.y);
    }, labels);
    assert.ok(rows.length >= 3, `${id}: category tick positions were not captured`);
    const canvas = await page.locator('.chart-preview canvas').boundingBox();
    assert.ok(canvas);
    for (const row of rows) {
      for (const fraction of [0.35, 0.7]) {
        await page.mouse.move(canvas.x + canvas.width * fraction, canvas.y + row.y);
        await settle();
        const tooltip = page.locator('body > [role="tooltip"][aria-hidden="false"]');
        await tooltip.waitFor();
        await page.waitForFunction((label) => document.querySelector('body > [role="tooltip"][aria-hidden="false"]')?.textContent.startsWith(label), row.text);
        assert.ok((await tooltip.textContent()).startsWith(row.text), `${id}: hovering ${row.text} selected ${await tooltip.textContent()}`);
      }
    }
    pass(`${id} tooltip follows the hovered row at different X positions`, { rows: rows.length });
  }

  await open('treemap');
  await page.getByRole('tab', { name: '데이터', exact: true }).click();
  const { labels } = await readChartData(page);
  await page.getByRole('tab', { name: '예제', exact: true }).click();
  await settle();
  const tiles = await page.evaluate((labels) => {
    const canvas = document.querySelector('.chart-preview canvas');
    const bounds = canvas.getBoundingClientRect();
    return window.chartLabelProbe.flatMap((point) => {
      const label = labels.find((label) => point.text === label || point.text.startsWith(`${label}: `));
      return label ? [{ text: label, x: point.x * bounds.width / canvas.width, y: point.y * bounds.height / canvas.height }] : [];
    });
  }, labels);
  assert.ok(tiles.length >= 10, 'treemap: tile label positions were not captured');
  const canvas = await page.locator('.chart-preview canvas').boundingBox();
  assert.ok(canvas);
  for (const tile of tiles) {
    await page.mouse.move(canvas.x + tile.x, canvas.y + tile.y);
    await settle();
    const tooltip = page.locator('body > [role="tooltip"][aria-hidden="false"]');
    await tooltip.waitFor();
    await page.waitForFunction((label) => document.querySelector('body > [role="tooltip"][aria-hidden="false"]')?.textContent.startsWith(label), `설비 ${tile.text}`);
    assert.ok((await tooltip.textContent()).startsWith(`설비 ${tile.text}`), `treemap: hovering ${tile.text} selected ${await tooltip.textContent()}`);
  }
  pass('treemap nearest hover follows tiles in both dimensions', { tiles: tiles.length });
}
