import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { connectBrowserForVerification } from './browser-session.mjs';
import { parseSync, Visitor } from 'vite';
import { legacySourcePaths } from '../src/features/code/source-paths.ts';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/structure';
const files = (await readdir('src', { recursive: true })).filter(file => /\.(?:ts|tsx|css)$/.test(file));
for (const file of files.filter(file => /\.(?:ts|tsx)$/.test(file))) {
  const source = await readFile(`src/${file}`, 'utf8');
  const parsed = parseSync(file, source);
  assert.deepEqual(parsed.errors, [], file);
  const inspect = (node) => {
    const specifier = node.source?.value;
    if (typeof specifier !== 'string' || !specifier.startsWith('.')) return;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier.split('?')[0]));
    assert.ok([base, `${base}.ts`, `${base}.tsx`, `${base}.css`, `${base}/index.ts`].some(candidate => files.includes(candidate)), `${file} -> ${specifier}`);
    if (file.startsWith('shared/') || file.startsWith('features/code/') && file !== 'features/code/source-paths.ts') {
      assert.ok(!base.startsWith('playgrounds/') && !base.startsWith('app/'), `Shared ownership: ${file} -> ${specifier}`);
    }
  };
  new Visitor({ ImportDeclaration: inspect, ExportNamedDeclaration: inspect, ExportAllDeclaration: inspect }).visit(parsed.program);
}
if (process.argv.includes('--static')) {
  for (const file of files) {
    assert.equal(await readFile(`dist/snippets/${file}`, 'utf8'), await readFile(`src/${file}`, 'utf8'), file);
  }
  for (const [legacy, file] of Object.entries(legacySourcePaths)) {
    assert.equal(await readFile(`dist/snippets/${legacy}`, 'utf8'), await readFile(`src/${file}`, 'utf8'), legacy);
  }
  console.log(`PASS source syntax, imports and snippets: ${files.length} sources, ${Object.keys(legacySourcePaths).length} aliases`);
  process.exit(0);
}
const browser = await connectBrowserForVerification();
const results = [];
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const pass = (scenario, details) => { results.push({ scenario, details }); console.log('PASS', scenario, details); };
  const settle = async () => page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  for (const file of files) {
    const source = await readFile(`src/${file}`, 'utf8');
    const response = await page.request.get(`${origin}/snippets/${file}`);
    assert.equal(response.status(), 200, file);
    assert.equal(await response.text(), source, file);
  }
  for (const [legacy, file] of Object.entries(legacySourcePaths)) {
    const response = await page.request.get(`${origin}/snippets/${legacy}`);
    assert.equal(response.status(), 200, legacy);
    assert.equal(await response.text(), await readFile(`src/${file}`, 'utf8'), legacy);
  }
  pass('Canonical sources, relative dependencies and legacy URLs', { sources: files.length, aliases: Object.keys(legacySourcePaths).length });

  for (const [id, name] of [['getting-started', 'guide'], ['custom-style', 'grid']]) {
    await page.goto(`${origin}/?package=datagrid&sample=${id}`);
    await page.locator(id === 'getting-started' ? '.getting-started' : '.grid-preview .OwpDataGrid-root').first().waitFor();
    await settle();
    const actual = await page.screenshot({ path: `${output}/after-${name}.png` });
    const baseline = await readFile(`${output}/before-${name}.png`);
    assert.ok(actual.equals(baseline), `Visual baseline: ${name}`);
  }
  await page.getByRole('button', { name: '테마 편집', exact: true }).click();
  await page.getByRole('dialog', { name: '테마 편집', exact: true }).waitFor();
  await settle();
  const editor = await page.screenshot({ path: `${output}/after-editor.png` });
  assert.ok(editor.equals(await readFile(`${output}/before-editor.png`)), 'Visual baseline: editor');
  await page.getByRole('button', { name: '테마 편집 닫기', exact: true }).click();
  pass('Guide, grid and theme editor visual equivalence', { matchingScreenshots: 3 });

  await page.getByRole('tab', { name: '코드', exact: true }).click();
  await page.getByRole('button', { name: '다운로드', exact: true }).waitFor({ state: 'visible' });
  for (const file of ['playgrounds/datagrid/examples/custom-style.tsx', 'features/theme-studio/model/schemas.ts', 'features/theme-studio/styles.css']) {
    await page.getByRole('combobox', { name: '소스 파일 선택', exact: true }).click();
    await page.locator(`[role=option][data-value="/src/${file}"]`).click();
    const source = await readFile(`src/${file}`, 'utf8');
    await page.waitForFunction(source => document.querySelector('.code-scroll code')?.textContent === source, source);
    await page.getByRole('button', { name: '복사', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), source);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '다운로드', exact: true }).click();
    const download = await pending;
    assert.equal(download.suggestedFilename(), path.posix.basename(file));
    assert.equal(await readFile(await download.path(), 'utf8'), source);
  }
  await page.screenshot({ path: `${output}/source-css.png` });
  assert.deepEqual(errors, []);
  pass('Displayed, copied and downloaded example/model/CSS are identical', { files: 3, errors });
  await writeFile(`${output}/report.json`, JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
