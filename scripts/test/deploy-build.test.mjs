import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateBuild } from '../deploy-build.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'owp-deploy-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, 'index.html'), '<script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">');
  await writeFile(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /');
  await writeFile(path.join(root, 'packages.json'), '{"packages":[{"name":"@owp/core"}]}');
  await writeFile(path.join(root, 'assets/app.js'), 'console.log("app")');
  await writeFile(path.join(root, 'assets/app.css'), 'body{margin:0}');
  return root;
}

test('validates the build directory and reports real file sizes', async (t) => {
  const root = await fixture(t);
  const result = await validateBuild(root);
  assert.equal(result.files, 5);
  assert.equal(result.assets, 2);
  assert.ok(result.bytes > 100);
});

for (const file of ['index.html', 'robots.txt', 'packages.json', 'assets/app.js', 'assets/app.css']) {
  test(`rejects a missing build file: ${file}`, async (t) => {
    const root = await fixture(t);
    await rm(path.join(root, file));
    await assert.rejects(validateBuild(root), /필수 파일|파일이 없습니다/);
  });
}

test('rejects an empty index instead of reusing an old build', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'index.html'), '');
  await assert.rejects(validateBuild(root), /필수 파일이 없거나 비어 있습니다/);
});

test('rejects missing files referenced by index.html even when other assets exist', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'index.html'), '<script src="/assets/missing.js"></script>');
  await assert.rejects(validateBuild(root), /참조한 파일이 없거나 비어 있습니다/);
});

test('rejects an empty package catalog', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'packages.json'), '{"packages":[]}');
  await assert.rejects(validateBuild(root), /packages 목록/);
});

test('rejects symlinks to files outside the artifact', async (t) => {
  const root = await fixture(t);
  await symlink('/etc/hosts', path.join(root, 'assets/external'));
  await assert.rejects(validateBuild(root), /일반 파일·디렉터리가 아닌 항목/);
});

test('rejects a symlink used as the dist root', async (t) => {
  const root = await fixture(t);
  const link = `${root}-link`;
  t.after(() => rm(link, { force: true }));
  await symlink(root, link);
  await assert.rejects(validateBuild(link), /symlink가 아닌 디렉터리/);
});
