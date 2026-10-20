import assert from 'node:assert/strict';

/** 기존 canvas text probe로 슬라이더와 실제로 그린 X축 범위를 함께 검증합니다. */
export async function verifyHistogramZoom(page, open, pass) {
  await open('histogram');
  const running = page.getByRole('switch', { name: '자동 갱신', exact: true });
  const start = page.getByRole('slider', { name: '측정값 범위 시작', exact: true });
  const end = page.getByRole('slider', { name: '측정값 범위 끝', exact: true });
  await running.uncheck();
  for (let index = 0; index < 6; index++) await start.press('ArrowRight');
  for (let index = 0; index < 7; index++) await end.press('ArrowLeft');

  const assertViewport = async () => {
    assert.equal(await start.getAttribute('aria-valuenow'), '6');
    assert.equal(await end.getAttribute('aria-valuenow'), '10');
    const first = await start.getAttribute('aria-valuetext');
    const last = await end.getAttribute('aria-valuetext');
    const canvas = page.locator('.chart-preview canvas[role="img"]');
    const labels = JSON.parse(await canvas.getAttribute('data-histogram-labels'));
    assert.equal(labels[0], first, '그린 X축 시작 구간이 슬라이더 범위와 같아야 합니다');
    assert.equal(labels.at(-1), last, '그린 X축 끝 구간이 슬라이더 범위와 같아야 합니다');
  };
  await assertViewport();
  await page.getByRole('button', { name: '데이터 갱신', exact: true }).click();
  await assertViewport();

  await running.check();
  for (let refresh = 0; refresh < 3; refresh++) {
    const previous = await start.getAttribute('aria-valuetext');
    await start.and(page.locator(
      `[aria-valuetext]:not([aria-valuetext=${JSON.stringify(previous)}])`,
    )).waitFor({ state: 'visible', timeoutMs: 10000, timeout: 10000 });
    await assertViewport();
  }
  await running.uncheck();
  pass('histogram preserves the rendered zoom range on manual and automatic refresh', {
    start: 6, end: 10, automaticRefreshes: 3,
  });
}
