import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { defaultMcpBundleRoot, prepareMcpBundle, selectMcpBundle } from '../deploy-mcp-bundle.mjs';
import { runMcpDeployment } from '../deploy-mcp.mjs';
import { mcpFixture, writeMcpFixtureBundle } from './deploy-mcp-fixture.mjs';

const execute = promisify(execFile);
const suffix = '0123456789ab';

async function selectionFixture(t) {
  const fixture = await mcpFixture(t);
  const bundleRoot = path.join(fixture.root, 'candidates');
  await mkdir(bundleRoot);
  const metadata = JSON.parse(await readFile(path.join(fixture.bundle, 'release.json'), 'utf8'));
  return { ...fixture, bundleRoot, metadata };
}

async function candidate(fixture, name, changes = {}) {
  const source = path.join(fixture.bundleRoot, `deploy-bundle-${name}`);
  await cp(fixture.bundle, source, { recursive: true });
  await writeFile(path.join(source, 'release.json'), JSON.stringify({ ...fixture.metadata, ...changes }));
  return source;
}

function offlineDependencies(bundleRoot, log = () => {}) {
  const calls = [];
  const stop = (name) => async () => { calls.push(name); throw new Error(`unexpected network: ${name}`); };
  return { calls, dependencies: { bundleRoot, log, interactive: false, confirm: stop('confirm'), checkPort: stop('port'), connect: stop('connect') } };
}

test('Given another working directory, When the bundle module loads, Then the default root remains anchored to the repository', async (t) => {
  const fixture = await selectionFixture(t);
  const moduleUrl = new URL('../deploy-mcp-bundle.mjs', import.meta.url).href;
  const { stdout } = await execute(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', `import {defaultMcpBundleRoot} from ${JSON.stringify(moduleUrl)}; console.log(defaultMcpBundleRoot);`], { cwd: fixture.root, timeout: 10000 });
  assert.equal(stdout.trim(), defaultMcpBundleRoot);
  assert.equal(defaultMcpBundleRoot, fileURLToPath(new URL('../../.omo/evidence/versioned-mcp', import.meta.url)));
});

test('Given misleading directory names and mtimes, When selecting, Then the newest releaseId timestamp wins', async (t) => {
  const fixture = await selectionFixture(t);
  const older = await candidate(fixture, 'zzzz', { releaseId: `20261023-110000-${suffix}` });
  const latest = await candidate(fixture, 'aaaa', { releaseId: `20261023-130000-${suffix}` });
  await utimes(older, new Date('2030-01-01'), new Date('2030-01-01'));
  await utimes(latest, new Date('2020-01-01'), new Date('2020-01-01'));
  assert.equal((await selectMcpBundle(fixture.bundleRoot)).source, latest);
});

test('Given draft, dirty, legacy, nested, and unrelated directories, When selecting, Then only eligible immediate candidates participate', async (t) => {
  const fixture = await selectionFixture(t);
  const selected = await candidate(fixture, 'stable');
  await candidate(fixture, 'draft', { channel: 'draft', releaseId: `20261023-230000-${suffix}` });
  await candidate(fixture, 'dirty', { dirty: true, releaseId: `20261023-230000-${suffix}` });
  await mkdir(path.join(fixture.bundleRoot, 'deploy-bundle-legacy'));
  await mkdir(path.join(fixture.bundleRoot, 'unrelated', 'deploy-bundle-nested'), { recursive: true });
  await writeFile(path.join(fixture.bundleRoot, 'unrelated', 'release.json'), 'corrupt');
  await writeFile(path.join(fixture.bundleRoot, 'deploy-bundle-file'), 'not a directory');
  assert.equal((await selectMcpBundle(fixture.bundleRoot)).source, selected);
});

for (const missing of [false, true]) test(`Given ${missing ? 'an absent root' : 'no eligible bundle'}, When selecting, Then the root and explicit override guidance are reported`, async (t) => {
  const fixture = await selectionFixture(t);
  if (!missing) await candidate(fixture, 'draft', { channel: 'draft' });
  const root = missing ? path.join(fixture.bundleRoot, 'absent') : fixture.bundleRoot;
  await assert.rejects(selectMcpBundle(root), (error) => {
    assert.ok(error.message.includes(root));
    assert.match(error.message, /--bundle DIR/);
    return true;
  });
});

for (const mutation of ['directory-symlink', 'metadata-symlink', 'corrupt-json', 'malformed-schema', 'invalid-time', 'oversized-metadata']) {
  test(`Given ${mutation} alongside an older valid candidate, When selecting, Then invalid advertised candidates fail without stale fallback`, async (t) => {
    const fixture = await selectionFixture(t);
    await candidate(fixture, 'older');
    const source = path.join(fixture.bundleRoot, 'deploy-bundle-invalid');
    if (mutation === 'directory-symlink') await symlink(fixture.bundle, source);
    else {
      await candidate(fixture, 'invalid', { releaseId: `20261023-140000-${suffix}` });
      const file = path.join(source, 'release.json');
      if (mutation === 'metadata-symlink') { await rm(file); await symlink(path.join(fixture.bundle, 'release.json'), file); }
      if (mutation === 'corrupt-json') await writeFile(file, '{');
      if (mutation === 'malformed-schema') await writeFile(file, JSON.stringify({ ...fixture.metadata, head: 'invalid' }));
      if (mutation === 'invalid-time') await writeFile(file, JSON.stringify({ ...fixture.metadata, releaseId: `20260230-140000-${suffix}` }));
      if (mutation === 'oversized-metadata') await writeFile(file, Buffer.alloc(1024 * 1024 + 1, 32));
    }
    await assert.rejects(selectMcpBundle(fixture.bundleRoot), (error) => {
      assert.ok(error.message.includes(source));
      assert.match(error.message, /--bundle DIR/);
      return true;
    });
  });
}

test('Given two candidates at the newest timestamp, When selecting, Then ambiguity lists both paths and requires an explicit override', async (t) => {
  const fixture = await selectionFixture(t);
  const first = await candidate(fixture, 'aaaa');
  const second = await candidate(fixture, 'zzzz', { releaseId: '20261023-120000-ffffffffffff' });
  await assert.rejects(selectMcpBundle(fixture.bundleRoot), (error) => {
    assert.ok(error.message.includes(first));
    assert.ok(error.message.includes(second));
    assert.match(error.message, /시간이 같아.*--bundle DIR/);
    return true;
  });
  const explicit = await prepareMcpBundle(first, { bundleRoot: fixture.bundleRoot });
  t.after(explicit.cleanup);
  assert.equal(explicit.source, first);
});

test('Given an explicit bundle and an invalid discovery root, When dry-run runs, Then discovery is bypassed and prepare receives the original path', async (t) => {
  const fixture = await selectionFixture(t);
  const { calls, dependencies } = offlineDependencies(path.join(fixture.root, 'absent'));
  let passed;
  dependencies.prepare = async (source, options) => { passed = source; return prepareMcpBundle(source, options); };
  const result = await runMcpDeployment({ bundle: fixture.bundle, dryRun: true }, dependencies);
  assert.equal(passed, fixture.bundle);
  assert.equal(result.plan.bundle, fixture.bundle);
  assert.deepEqual(calls, []);
});

test('Given no --bundle and a valid latest bundle, When dry-run runs, Then its absolute path and release are logged without network access', async (t) => {
  const fixture = await selectionFixture(t);
  const selected = await candidate(fixture, 'latest');
  const logs = [];
  const { calls, dependencies } = offlineDependencies(fixture.bundleRoot, (value) => logs.push(value));
  const result = await runMcpDeployment({ dryRun: true }, dependencies);
  assert.equal(result.plan.bundle, selected);
  assert.equal(result.plan.releaseId, fixture.metadata.releaseId);
  assert.ok(logs[0].includes(selected));
  assert.ok(logs[0].includes(fixture.metadata.releaseId));
  assert.equal(JSON.parse(logs.at(-1)).bundle, selected);
  assert.deepEqual(calls, []);
});

for (const corruption of ['missing-file', 'wrong-hash']) test(`Given a latest bundle with ${corruption} and an older valid bundle, When running, Then preparation fails without fallback or network`, async (t) => {
  const fixture = await selectionFixture(t);
  await candidate(fixture, 'older');
  const release = await writeMcpFixtureBundle(fixture, { releaseId: `20261023-130000-${suffix}` });
  fixture.metadata = release;
  const latest = await candidate(fixture, 'latest');
  if (corruption === 'missing-file') await rm(path.join(latest, 'archive.tar.gz'));
  else await writeFile(path.join(latest, 'app.tar.gz'), 'corrupted');
  const { calls, dependencies } = offlineDependencies(fixture.bundleRoot);
  await assert.rejects(runMcpDeployment({}, dependencies), (error) => {
    assert.ok(error.message.includes(latest));
    assert.match(error.message, corruption === 'missing-file' ? /ENOENT/ : /SHA-256/);
    return true;
  });
  assert.deepEqual(calls, []);
});

test('Given metadata changed after ranking, When the selected bundle is frozen, Then the original metadata fingerprint rejects the replacement', async (t) => {
  const fixture = await selectionFixture(t);
  const selected = await candidate(fixture, 'latest');
  const selection = await selectMcpBundle(fixture.bundleRoot);
  await writeMcpFixtureBundle(fixture, { releaseId: `20261023-130000-${suffix}` });
  await cp(fixture.bundle, selected, { recursive: true });
  await assert.rejects(prepareMcpBundle(selection.source, { expectedMetadataSha256: selection.metadataSha256 }), /선택 후 release.json이 변경/);
});

test('Given an explicitly empty path, When preparing, Then it fails instead of falling back to discovery', async () => {
  await assert.rejects(prepareMcpBundle(''), /--bundle DIR/);
});
