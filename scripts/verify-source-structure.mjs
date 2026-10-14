import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import ts from 'typescript';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = '.omo/evidence/structure';
const manifestSource = await readFile('src/features/code/source-paths.ts', 'utf8');
const compiled = ts.transpileModule(manifestSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { legacySourcePaths } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const files = (await readdir('src', { recursive: true })).filter(file => /\.(?:ts|tsx|css)$/.test(file));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
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
    if (/\.(?:ts|tsx)$/.test(file)) {
      const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      function visit(node) {
        const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier;
        if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
          const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier.text.split('?')[0]));
          assert.ok([base, `${base}.ts`, `${base}.tsx`, `${base}.css`, `${base}/index.ts`].some(candidate => files.includes(candidate)), `${file} -> ${specifier.text}`);
          if (file.startsWith('shared/') || file.startsWith('features/code/') && file !== 'features/code/source-paths.ts') {
            assert.ok(!base.startsWith('playgrounds/') && !base.startsWith('app/'), `Shared ownership: ${file} -> ${specifier.text}`);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(parsed);
    }
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
