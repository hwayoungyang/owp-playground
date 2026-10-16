import { verifyOwpLegendStates } from './chart-interactions.mjs';

/** 이미 연결된 브라우저 tab을 받습니다. 이 모듈은 browser나 dev server를 실행하지 않습니다. */
export async function runChartBrowserRegressions(
  tab,
  routes,
  capture,
) {
  if (typeof capture !== "function") throw new TypeError("증거를 저장할 capture callback이 필요합니다");
  const page = tab.playwright;
  const results = [];
  const expect = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const open = async (id) => {
    const url = routes.find(
      (route) => new URL(route.url).searchParams.get("sample") === id,
    )?.url;
    if (!url) throw new Error(`Missing visible sample route: ${id}`);
    await tab.goto(url);
    await page
      .locator('#main-content canvas[role="img"]')
      .first()
      .waitFor({ state: "visible" });
  };
  const legend = (name) =>
    page.locator(".chart-preview button[aria-pressed]").filter({ hasText: name });
  const pressed = (item) => item.getAttribute("aria-pressed", {});
  const record = async (name) => {
    await capture(name, tab);
    results.push(name);
  };

  await verifyOwpLegendStates(page, open, record);

  await open("legend");
  const animation = page.getByRole("switch", {
    name: "범례 애니메이션",
    exact: true,
  });
  const plan = legend(/^계획$/);
  const actual = legend(/^실적$/);
  await animation.uncheck();
  await plan.click();
  expect((await pressed(plan)) === "false", "애니메이션을 끄면 범례로 series를 숨길 수 있어야 합니다");
  expect((await pressed(actual)) === "true", "다른 series는 계속 표시되어야 합니다");
  await animation.check();
  expect((await pressed(plan)) === "false", "애니메이션 설정을 바꿔도 숨김 상태를 유지해야 합니다");
  await page.getByRole("slider", { name: "표시할 월 수", exact: true }).press("Home");
  expect((await pressed(plan)) === "false", "데이터를 교체해도 series의 숨김 상태를 유지해야 합니다");
  await plan.click();
  expect((await pressed(plan)) === "true", "애니메이션을 켜면 범례로 series를 복원할 수 있어야 합니다");
  await record("legend-animation-policy-preserves-visibility");

  await open("horizontal-bar");
  await page.locator('#main-content canvas[role="img"]').click();
  const rowTooltip = await page.getByRole("tooltip").textContent();
  expect(
    /\d+월/.test(rowTooltip) && /실적/.test(rowTooltip),
    "Horizontal index must select a row and its actual value",
  );
  await record("horizontal-row-tooltip");

  await open("heatmap");
  await page.getByRole("switch", { name: "값 표시", exact: true }).check();
  await page.locator('#main-content canvas[role="img"]').click();
  const cellTooltip = await page.getByRole("tooltip").textContent();
  expect(
    /·\s*\d+:00/.test(cellTooltip) && /생산량.*\d+.*개/.test(cellTooltip),
    "Cell tooltip must identify both coordinates and its value",
  );
  await record("heatmap-cell-tooltip");

  await open("treemap");
  const group = legend(/^A$/);
  await group.click();
  expect((await pressed(group)) === "false", "Treemap group must hide");
  await record("treemap-group-hidden");
  await group.click();
  expect((await pressed(group)) === "true", "Treemap group must restore");

  await open("live");
  await page.getByRole("button", { name: "일시정지", exact: true }).click();
  expect(
    await page
      .getByRole("button", { name: "다시 시작", exact: true })
      .isVisible(),
    "Live chart must pause",
  );
  const reading = legend(/^측정값$/);
  await reading.click();
  expect((await pressed(reading)) === "false", "일시정지 중에도 마지막 Live series를 숨길 수 있어야 합니다");
  const count = page.getByRole("slider", {
    name: "표시할 데이터 수",
    exact: true,
  });
  const before = Number(await count.getAttribute("value", {}));
  await count.press("ArrowRight");
  expect(
    Number(await count.getAttribute("value", {})) > before,
    "Live window count must remain interactive",
  );
  await page.getByRole("button", { name: "한 건 추가", exact: true }).click();
  expect((await pressed(reading)) === "false", "Live 데이터를 추가해도 수동 숨김을 유지해야 합니다");
  await reading.click();
  expect((await pressed(reading)) === "true", "일시정지 중에도 마지막 Live series를 복원할 수 있어야 합니다");
  await page.getByRole("button", { name: "다시 시작", exact: true }).click();
  expect(
    await page
      .getByRole("button", { name: "일시정지", exact: true })
      .isVisible(),
    "Live chart must resume",
  );
  await record("live-pause-input-resume");
  await open("bar");
  return results;
}
