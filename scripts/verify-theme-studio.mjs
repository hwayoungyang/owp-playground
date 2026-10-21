import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { connectBrowserForVerification } from './browser-session.mjs';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/theme-studio';
await mkdir(output, { recursive: true });
const browser = await connectBrowserForVerification();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const results = [];
const captures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error' || message.text().includes('out-of-range')) errors.push(message.text()); });
const pass = (scenario, observed) => { results.push({ scenario, observed, pass: true }); console.log('PASS', scenario, observed); };
async function settle() { await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished)); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }); }
async function shot(name) { await settle(); const path = `${output}/${name}.png`; await page.screenshot({ path }); captures.push({ path, viewport: page.viewportSize() }); }
async function load(id) { await page.goto(`${origin}/?package=datagrid&sample=${id}`); await page.locator(id === 'getting-started' ? '.getting-started' : '.grid-preview .OwpDataGrid-root').first().waitFor(); await settle(); }
const editor = () => page.getByRole('dialog', { name: '테마 편집', exact: true });
async function openEditor() { await page.getByRole('button', { name: '테마 편집', exact: true }).click(); await editor().waitFor(); await settle(); }
async function closeEditor() { await page.getByRole('button', { name: '테마 편집 닫기', exact: true }).click(); await editor().waitFor({ state: 'hidden' }); }
async function choosePreset(value) { await editor().getByRole('combobox', { name: '테마', exact: true }).click(); await page.locator(`[role=option][data-value="${value}"]`).click(); await settle(); }
async function change(label, value) { const field = editor().getByRole('textbox', { name: label, exact: true }); await field.fill(value); await field.press('Enter'); await settle(); }
async function save() { const downloaded = page.waitForEvent('download'); await editor().getByRole('button', { name: '파일 저장', exact: true }).click(); const file = await downloaded; assert.equal(file.suggestedFilename(), 'owp-theme.json'); return JSON.parse(await readFile(await file.path(), 'utf8')); }
async function upload(config) { await editor().locator('input[type=file]').setInputFiles({ name: 'owp-theme.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)) }); }
async function colors() { return page.locator('.grid-preview .OwpDataGrid-root').first().evaluate(root => { const header = [...root.querySelectorAll('.OwpDataGrid-headerCell')].find(cell => cell.textContent.trim() === '프로젝트'); let surface = header; while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)' && surface.parentElement) surface = surface.parentElement; return { header: getComputedStyle(surface).backgroundColor, headerPanelsMatch: [...root.querySelectorAll('.OwpDataGrid-headerRow [role=columnheader]:not(.OwpDataGrid-headerCell)')].every(panel => getComputedStyle(panel).backgroundColor === getComputedStyle(surface).backgroundColor), headerFont: getComputedStyle(header).fontSize, cellFont: getComputedStyle(root.querySelector('.OwpDataGrid-cell')).fontSize, radius: getComputedStyle(root).borderRadius }; }); }
async function visibleSelection(scope) { return scope.locator('.nav-list').evaluate(list => { const viewport = list.getBoundingClientRect(); const active = list.querySelector('[aria-current=page]'); const item = active?.getBoundingClientRect(); return { scrollTop: list.scrollTop, visible: Boolean(item && item.top >= viewport.top && item.bottom <= viewport.bottom), active: active?.textContent.trim(), mainTop: document.querySelector('.main-content').scrollTop }; }); }
async function topCenter(alert) { const box = await alert.locator('xpath=..').boundingBox(); assert.ok(box.y < 40, JSON.stringify(box)); assert.ok(Math.abs(box.x + box.width / 2 - page.viewportSize().width / 2) < 2, JSON.stringify(box)); return box; }
async function axe() { await settle(); const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(report.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), []); }
async function switchPackage(id) { await page.getByRole('button', { name: '패키지 선택', exact: true }).click(); await page.locator(`[role=menuitem][data-package="${id}"]`).click(); await settle(); }

try {
  await load('getting-started');
  assert.match(await page.locator('.guide-note').textContent(), /Impix SmartBiz 팀/);
  const favicon = await page.locator('link[rel=icon]').getAttribute('href');
  assert.equal(favicon, '/brand/owp-symbol.svg');
  assert.equal((await page.request.get(`${origin}${favicon}`)).status(), 200);
  await page.getByRole('button', { name: '링크 복사', exact: true }).click();
  const copied = page.getByRole('alert').filter({ hasText: '링크를 복사했습니다.' });
  await copied.waitFor();
  const snackbar = await topCenter(copied);
  assert.equal(await page.locator('.workspace-heading').getByText('링크를 복사했습니다.').count(), 0);
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), page.url());
  await shot('copy-top-center');
  pass('OWP favicon and top-centered link snackbar', { favicon, snackbar });

  await load('large-data');
  const direct = await visibleSelection(page.locator('.desktop-sidebar'));
  assert.equal(direct.visible, true);
  assert.ok(direct.scrollTop > 0);
  assert.equal(direct.mainTop, 0);
  await page.locator('.desktop-sidebar').getByRole('button', { name: '데이터·로딩 (Data & loading)', exact: true }).click();
  await page.locator('.desktop-sidebar a.nav-item[href*="sample=overview"]').click();
  await page.getByRole('heading', { level: 1, name: '표시 행 수 고정', exact: true }).waitFor();
  await page.goBack();
  await page.getByRole('heading', { level: 1, name: '대용량 데이터', exact: true }).waitFor();
  await settle();
  const history = await visibleSelection(page.locator('.desktop-sidebar'));
  assert.equal(history.visible, true);
  pass('direct URLs and browser history reveal the selected sidebar item', { direct, history });

  await openEditor();
  assert.equal(await editor().locator('.OwpDataGrid-root').count(), 0);
  assert.equal(await editor().getByText('OwpDataGrid의 테마를 설정합니다.', { exact: true }).count(), 1);
  assert.equal(await editor().getByRole('button', { name: '행', exact: true }).count(), 1);
  assert.equal(await editor().locator('.theme-project-usage .MuiAccordion-root').count(), 0);
  const usage = editor().locator('.theme-project-usage');
  assert.equal(await usage.locator('.code-viewer').count(), 4);
  assert.ok(await usage.locator('.hljs-keyword').count() > 0);
  await usage.getByRole('button', { name: 'src/configs/theme/grid.ts 복사', exact: true }).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /config\.dataGrid satisfies OwpGridThemeConfigType/);
  await page.getByRole('alert').filter({ hasText: '복사했습니다.' }).waitFor();
  await shot('project-code-snippets');
  await editor().locator('.theme-studio-body').evaluate(body => { body.scrollTop = 0; });
  await editor().getByRole('combobox', { name: '테마', exact: true }).click();
  const menu = page.getByRole('listbox');
  const names = await menu.locator('[role=option][data-value]').allTextContents();
  assert.deepEqual(names.map(name => name.trim()), ['화면과 같게', 'Carbon', 'Industrial', 'Navy', 'Teal', 'Plum', 'Olive', 'Bronze', 'Sand', 'Solarized', 'High Contrast', '한금']);
  assert.equal(await menu.getByText('일반 테마', { exact: true }).count(), 1);
  assert.equal(await menu.getByText('프로젝트', { exact: true }).count(), 1);
  await shot('presets-grouped');
  await page.locator('[role=option][data-value=carbon]').click();
  await editor().getByRole('button', { name: '글자 크기·모서리', exact: true }).click();
  assert.equal(await editor().getByRole('textbox', { name: '글꼴', exact: true }).count(), 0);
  await change('글자 크기', '15');
  await change('radius (rem)', '0.6');
  await editor().getByRole('button', { name: '헤더 배경 MUI 색상 선택', exact: true }).click();
  const palette = page.getByRole('dialog', { name: /^MUI 색상 팔레트/ });
  await palette.waitFor();
  const families = await palette.locator('.color-palette-family h3').allTextContents();
  assert.deepEqual(families, ['red', 'pink', 'purple', 'deepPurple', 'indigo', 'blue', 'lightBlue', 'cyan', 'teal', 'green', 'lightGreen', 'lime', 'yellow', 'amber', 'orange', 'deepOrange', 'brown', 'grey', 'blueGrey', 'common']);
  await axe();
  await shot('mui-palette-desktop');
  await palette.getByRole('button', { name: 'blue 700 #1976d2', exact: true }).click();
  assert.equal(await editor().getByRole('textbox', { name: '헤더 배경', exact: true }).inputValue(), '#1976d2');
  assert.equal(await editor().locator('.theme-settings input[type=color]').count(), 1);
  const saved = await save();
  assert.equal(saved.dataGrid.header.backgroundColor, '#1976d2');
  assert.equal(saved.dataGrid.header.fontSize, 15);
  assert.equal(saved.dataGrid.cell.fontSize, 15);
  assert.equal(saved.dataGridProps.radius, 0.6);
  assert.equal(saved.mui.typography.fontFamily, undefined);
  await editor().getByRole('button', { name: '글자 크기·모서리', exact: true }).click();
  await editor().getByRole('button', { name: '테마 초기화', exact: true }).click();
  await upload(saved);
  const imported = page.getByRole('alert').filter({ hasText: '테마를 불러왔습니다.' });
  await imported.waitFor();
  await topCenter(imported);
  assert.deepEqual(await save(), saved);
  await shot('imported-theme');
  await closeEditor();
  const applied = await colors();
  assert.equal(applied.header, 'rgb(25, 118, 210)');
  assert.equal(applied.headerPanelsMatch, true);
  assert.equal(applied.headerFont, '15px');
  assert.equal(applied.cellFont, '15px');
  assert.equal(applied.radius, '9.6px');
  await page.locator('.desktop-sidebar a.nav-item[href*="sample=overview"]').click();
  await page.locator('.grid-preview .OwpDataGrid-root').waitFor();
  await settle();
  assert.deepEqual(await colors(), applied);
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await settle();
  assert.deepEqual(await colors(), applied);
  await page.getByRole('button', { name: '설정 열기', exact: true }).click();
  assert.equal(await page.getByRole('combobox', { name: '모서리 둥글기', exact: true }).textContent(), '0.6 rem');
  await page.getByRole('button', { name: '설정 닫기', exact: true }).click();
  pass('palette choices, font size and radius survive file round trips, navigation and data reset', { families, applied, presetGroups: names });

  await openEditor();
  await upload({ ...saved, version: 999 });
  await page.getByRole('alert').filter({ hasText: '테마 파일을 확인해 주세요.' }).waitFor();
  assert.deepEqual(await save(), saved);
  await editor().getByRole('button', { name: '글자 크기·모서리', exact: true }).click();
  await change('글자 크기', '-1');
  assert.equal(await editor().getByRole('textbox', { name: '글자 크기', exact: true }).getAttribute('aria-invalid'), 'true');
  assert.deepEqual(await save(), saved);
  await change('글자 크기', '15');
  await closeEditor();
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  await page.getByRole('button', { name: 'Theme editor', exact: true }).click();
  const english = page.getByRole('dialog', { name: 'Theme editor', exact: true });
  await english.waitFor();
  assert.equal(await english.getByText('Configure the OwpDataGrid theme.', { exact: true }).count(), 1);
  for (const name of ['Font size & corners', 'Component colors', 'Header', 'Body', 'Row', 'Cell']) assert.equal(await english.getByRole('button', { name, exact: true }).count(), 1, name);
  await english.getByRole('button', { name: 'Header', exact: true }).click();
  await english.getByRole('textbox', { name: 'Header · Background color', exact: true }).waitFor();
  assert.equal(await english.getByRole('textbox', { name: 'Header · Background color', exact: true }).count(), 1);
  assert.equal(/backgroundColor|fontSize|sortIconColor/.test(await english.locator('.theme-studio-body').innerText().then(text => text.split('Use in a project')[0])), false);
  await english.getByRole('button', { name: 'Header background Choose MUI color', exact: true }).click();
  const englishPalette = page.getByRole('dialog', { name: /^MUI color palette/ });
  await englishPalette.waitFor();
  assert.deepEqual(await englishPalette.locator('.color-palette-family h3').allTextContents(), families);
  await page.getByRole('button', { name: 'Close color palette', exact: true }).click();
  await english.getByRole('button', { name: 'Close theme editor', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to Korean', exact: true }).click();
  pass('invalid imports and values preserve settings; editor labels translate while palette hue names remain English', { atomicImport: true, languages: ['ko', 'en'] });

  await switchPackage('components');
  await page.getByRole('heading', { level: 1, name: 'OwpComponents', exact: true }).waitFor();
  await openEditor();
  assert.equal(await editor().getByText('OwpComponents의 테마를 설정합니다.', { exact: true }).count(), 1);
  assert.equal(await editor().getByRole('combobox', { name: '테마', exact: true }).textContent(), '화면과 같게');
  await editor().getByRole('button', { name: '글자 크기·모서리', exact: true }).click();
  await change('글자 크기', '21');
  await change('borderRadius (px)', '12');
  assert.equal((await save()).mui.typography.fontSize, 21);
  assert.equal((await save()).mui.shape.borderRadius, 12);
  await shot('components-theme');
  await closeEditor();
  await switchPackage('tailwind-config');
  assert.equal(await page.getByRole('button', { name: '테마 편집', exact: true }).count(), 0);
  await switchPackage('datagrid');
  await page.locator('.getting-started').waitFor();
  await openEditor();
  assert.deepEqual(await save(), saved);
  await closeEditor();
  pass('DataGrid and Components have independent themes and unrelated packages hide the editor', { enabled: ['datagrid', 'components'], hidden: 'tailwind-config' });

  await load('formatting');
  const cost = page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').nth(2);
  await cost.dblclick();
  const number = page.locator('.OwpDataGrid-root input:not([type=checkbox])').first();
  await number.waitFor();
  await number.press('a');
  const rejected = page.getByRole('alert').filter({ hasText: '허용되지 않는 값입니다.' });
  await rejected.waitFor();
  await topCenter(rejected);
  await shot('native-snackbar-top-center');
  await number.press('Escape');
  pass('native DataGrid feedback also appears at the top center', { feedback: await rejected.textContent() });

  const worksheet = [];
  for (const viewport of [{ width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 375, height: 900 }]) {
    await page.setViewportSize(viewport);
    await load('worksheet');
    const dimensions = await page.locator('.main-content').evaluate(main => ({ height: main.clientHeight, content: main.scrollHeight, width: document.documentElement.scrollWidth, viewport: innerWidth, grid: document.querySelector('.grid-preview').getBoundingClientRect().height }));
    assert.ok(dimensions.content <= dimensions.height + 1, JSON.stringify({ viewport, dimensions }));
    assert.ok(dimensions.width <= dimensions.viewport);
    await shot(`worksheet-${viewport.width}`);
    worksheet.push({ viewport, dimensions });
  }
  pass('calculated-cell example fits the page without body scrolling across desktop, tablet and mobile', worksheet);

  await load('large-data');
  await page.getByRole('button', { name: '탐색 메뉴 열기', exact: true }).click();
  const mobileNav = page.locator('.MuiDrawer-paper .sidebar');
  await mobileNav.waitFor();
  await settle();
  const mobileSelection = await visibleSelection(mobileNav);
  assert.equal(mobileSelection.visible, true);
  assert.ok(mobileSelection.scrollTop > 0);
  await shot('mobile-selected-menu');
  await page.keyboard.press('Escape');
  await mobileNav.waitFor({ state: 'hidden' });
  await openEditor();
  await editor().getByRole('button', { name: '헤더 배경 MUI 색상 선택', exact: true }).click();
  await axe();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await shot('mui-palette-mobile');
  await page.getByRole('button', { name: '색상 팔레트 닫기', exact: true }).click();
  await choosePreset('hankum');
  await editor().getByRole('button', { name: '어둡게', exact: true }).click();
  await axe();
  await shot('theme-mobile-dark');
  await editor().getByRole('button', { name: '테마 초기화', exact: true }).click();
  await editor().getByRole('button', { name: '글자 크기·모서리', exact: true }).click();
  await change('radius (rem)', '0.8');
  assert.equal(await editor().getByRole('button', { name: '테마 초기화', exact: true }).isEnabled(), true);
  await editor().getByRole('button', { name: '테마 초기화', exact: true }).click();
  await closeEditor();
  pass('mobile palette and dark preset fit, remain accessible and reset radius-only edits', { mobileSelection, axeViolations: 0 });

  await page.setViewportSize({ width: 1280, height: 900 });
  await load('overview');
  await openEditor();
  await editor().getByRole('button', { name: '헤더', exact: true }).click();
  const beforeInvalid = await save();
  await change('헤더 · 비활성 정렬 아이콘 opacity', '2');
  await editor().getByText('0~1 사이의 숫자를 입력해 주세요.', { exact: true }).waitFor();
  assert.deepEqual(await save(), beforeInvalid);
  await editor().getByText('0~1 사이의 숫자를 입력해 주세요.', { exact: true }).scrollIntoViewIfNeeded();
  await shot('opacity-validation-korean');
  await change('헤더 · 비활성 정렬 아이콘 opacity', '0.25');
  assert.equal((await save()).dataGrid.header.sortIconInactiveOpacity, 0.25);
  assert.equal(await editor().getByText('0~1 사이의 숫자를 입력해 주세요.', { exact: true }).count(), 0);
  await editor().getByRole('button', { name: '동작 효과', exact: true }).click();
  await change('동작 효과 · easing', 'fast');
  await editor().getByText('linear, ease, ease-in, ease-out, ease-in-out 또는 cubic-bezier(...)를 입력해 주세요.', { exact: true }).waitFor();
  await change('동작 효과 · easing', 'linear');
  assert.equal((await save()).dataGrid.motion.easing, 'linear');
  await editor().locator('input[type=file]').setInputFiles({ name: 'large-theme.json', mimeType: 'application/json', buffer: Buffer.alloc(256 * 1024 + 1, 32) });
  await page.getByRole('alert').filter({ hasText: '256KiB 이하의 테마 파일을 선택해 주세요.' }).waitFor();
  assert.equal((await save()).dataGrid.header.sortIconInactiveOpacity, 0.25);
  await closeEditor();
  await page.getByRole('button', { name: '영어로 전환', exact: true }).click();
  await page.getByRole('button', { name: 'Theme editor', exact: true }).click();
  const englishValidation = page.getByRole('dialog', { name: 'Theme editor', exact: true });
  await englishValidation.getByRole('button', { name: 'Header', exact: true }).click();
  const opacity = englishValidation.getByRole('textbox', { name: 'Header · Inactive sort icon opacity', exact: true });
  await opacity.fill('-1');
  await opacity.press('Enter');
  await englishValidation.getByText('Enter a number between 0 and 1.', { exact: true }).waitFor();
  await englishValidation.getByText('Enter a number between 0 and 1.', { exact: true }).scrollIntoViewIfNeeded();
  await shot('opacity-validation-english');
  await opacity.fill('0.5');
  await opacity.press('Enter');
  assert.equal(await opacity.getAttribute('aria-invalid'), 'false');
  pass('localized validation explains the range and format, rejects oversized files and preserves applied values', { opacity: [2, 0.25, -1, 0.5], maxFileBytes: 256 * 1024, languages: ['ko', 'en'] });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors, captures }, null, 2));
  console.log('PASS', results.length, 'theme scenarios;', captures.length, 'screenshots');
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` });
  await writeFile(`${output}/failure.json`, JSON.stringify({ error: String(error), errors, results }, null, 2));
  throw error;
} finally { await browser.close(); }
