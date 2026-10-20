import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { connectBrowserForVerification } from './browser-session.mjs';
const output = '.omo/evidence/api-expansion';
await mkdir(output, { recursive: true });
const browser = await connectBrowserForVerification();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(10000);
const results = [];
const pass = (scenario, observed) => { results.push({scenario, observed, pass:true}); console.log('PASS',scenario,observed); };
async function load(id) { await page.goto(`http://127.0.0.1:4173/?sample=${id}`); await page.locator('.grid-preview .OwpDataGrid-root').first().waitFor(); }
async function settle() { await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity && typeof a.effect?.getTiming().duration === 'number').map(a => a.finished)); }); }
try {
  const catalog = JSON.parse(await readFile('dist/catalog.json','utf8'));
  for (const sample of process.env.PLAYGROUND_SKIP_SNIPPETS ? [] : catalog.samples.filter(sample => sample.kind === 'grid')) {
    console.log('Checking snippet',sample.id);
    await load(sample.id);
    await page.getByRole('tab',{name:'코드',exact:true}).click();
    const source = await readFile(`src/playgrounds/datagrid/${sample.source}`,'utf8');
    await page.waitForFunction(source => document.querySelector('.code-scroll code')?.textContent === source, source, { timeout: 10000 });
    const response = await page.request.get(`http://127.0.0.1:4173/snippets/samples/${sample.source}`);
    assert.equal(await response.text(),source);
  }
  if (!process.env.PLAYGROUND_SKIP_SNIPPETS) pass('all displayed and published snippets match formatted executing files',{samples:catalog.samples.filter(sample => sample.kind === 'grid').length});
  await load('formatting');
  const time = page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').nth(6);
  assert.ok((await time.textContent()).includes('09:30:00'));
  await time.click();
  const values = await page.locator('input').evaluateAll(items => items.map(e=>e.value));
  assert.ok(values.includes('09:30:00'),JSON.stringify(values));
  await settle(); await page.screenshot({path:`${output}/time-picker.png`}); await page.keyboard.press('Escape');
  pass('time display and picker precision',{value:'09:30:00'});
  for (const [id,value,index] of [['date-year','2024',4],['date-month','2026-01',5]]) {
    await load('formatting'); assert.ok((await page.locator('[data-owp-data-grid-row-key="string:task-1"]').textContent()).includes(value));
    await page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').nth(index).click();
    assert.ok((await page.locator('input').evaluateAll(items=>items.map(e=>e.value))).includes(value));
    await settle(); await page.screenshot({path:`${output}/${id}-picker.png`}); await page.keyboard.press('Escape');
    pass(id,{value});
  }
  for (const id of ['cell-background','row-background']) {
    await load(id);
    const colors = await page.locator('[data-owp-data-grid-row-key="string:task-2"] .OwpDataGrid-cell').evaluateAll(items => items.map(e => getComputedStyle(e).backgroundColor));
    assert.equal(colors[5],'rgb(234, 241, 255)');
    if (id === 'row-background') assert.ok(colors.every(c=>c==='rgb(234, 241, 255)'));
    else assert.equal(colors[0],'rgba(0, 0, 0, 0)');
    pass(id,{colors});
  }
  await load('nested-tree'); assert.ok(await page.locator('[aria-level="4"]').count()); pass('four visible hierarchy levels',{deepRows:await page.locator('[aria-level="4"]').count()});
  await load('summary-rows');
  const lines = await page.evaluate(() => { const border = getComputedStyle(document.querySelector('.OwpDataGrid-scrollFrame'),'::after'); return {outer:getComputedStyle(document.querySelector('.workspace-frame')).borderLeftWidth, bottom:border.borderBottomWidth, left:border.borderLeftWidth, right:border.borderRightWidth}; });
  assert.equal(lines.outer,'0px'); assert.equal(lines.bottom,'1px'); assert.equal(lines.left,'1px'); assert.equal(lines.right,'1px');
  await settle(); await page.screenshot({path:`${output}/summary-border.png`}); pass('native grid owns a single perimeter',lines);
  for (const width of [1440,768,375]) {
    await page.setViewportSize({width,height:1100}); await load('detail-custom'); await page.locator('.grid-preview button[aria-expanded]').first().click();
    await page.getByText('남은 수량',{exact:true}).waitFor(); await page.waitForFunction(()=>document.querySelector('.project-progress dd')?.textContent==='232');
    await settle(); await page.screenshot({path:`${output}/detail-panel-${width}.png`});
    const panelWidth = await page.locator('.project-detail').evaluate(e=>e.getBoundingClientRect().width);
    assert.ok(panelWidth <= width,JSON.stringify({width,panelWidth}));
    await page.locator('.project-detail').evaluate(e=>e.scrollTop=e.scrollHeight);
    await settle(); await page.screenshot({path:`${output}/detail-panel-end-${width}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  pass('detail panel progress and responsive layout',{plan:232,completed:111,remaining:121});
  await load('detail-grid'); await page.locator('.grid-preview button[aria-expanded]').first().click(); await page.locator('.detail-grid-toolbar').waitFor();
  assert.equal(await page.locator('.detail-grid-toolbar .MuiButton-startIcon svg').count(),1); pass('detail Excel start icon',{icons:1});
  await writeFile(`${output}/polish-functional.json`,JSON.stringify(results,null,2));
} finally { await browser.close(); }
