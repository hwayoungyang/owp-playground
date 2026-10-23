import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const preflightUrl = new URL('../deploy-mcp-preflight.mjs', import.meta.url).href;
const remoteUrl = new URL('../deploy-mcp-remote.mjs', import.meta.url).href;
const installed = { command: 'pnpm', prefix: [], version: '12.15.0' };
const cached = { command: 'corepack', prefix: ['pnpm@12.15.0'], version: '12.15.0' };
const installArgs = ['install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--config.manage-package-manager-versions=false'];

async function runtimeFixture(t, candidates) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-mcp-runtime-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  const app = path.join(root, 'app');
  const unrelated = path.join(root, 'unrelated');
  const log = path.join(root, 'calls.jsonl');
  await Promise.all([mkdir(bin), mkdir(app), mkdir(unrelated)]);
  await writeFile(path.join(unrelated, 'package.json'), JSON.stringify({ packageManager: 'pnpm@99.0.0', devEngines: { runtime: { name: 'node', version: '99.0.0', onFail: 'download' } } }));
  await writeFile(path.join(unrelated, '.npmrc'), 'manage-package-manager-versions=true\n');
  await writeFile(path.join(app, 'package.json'), JSON.stringify({ packageManager: 'pnpm@99.0.0' }));
  await writeFile(path.join(app, '.npmrc'), 'manage-package-manager-versions=true\n');
  for (const [command, candidate] of Object.entries(candidates)) {
    const file = path.join(bin, command);
    await writeFile(file, `#!${process.execPath}
import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(log)}, JSON.stringify({ command: ${JSON.stringify(command)}, args, cwd: process.cwd(), env: { NODE_ENV: process.env.NODE_ENV, COREPACK_ENABLE_NETWORK: process.env.COREPACK_ENABLE_NETWORK, COREPACK_ENABLE_PROJECT_SPEC: process.env.COREPACK_ENABLE_PROJECT_SPEC, npm_config_manage_package_manager_versions: process.env.npm_config_manage_package_manager_versions } }) + '\\n');
if (${JSON.stringify(candidate.fail ?? false)}) process.exit(2);
if (args.at(-1) === '--version') process.stdout.write(${JSON.stringify(candidate.version ?? '12.15.0')});
else if (!args.includes('install')) process.exit(3);
`);
    await chmod(file, 0o755);
  }
  const run = async (operation, selection) => execute(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `
import { selectMcpPackageManager } from ${JSON.stringify(preflightUrl)};
import { installMcpDependencies } from ${JSON.stringify(remoteUrl)};
if (${JSON.stringify(operation)} === 'select') console.log(JSON.stringify(await selectMcpPackageManager()));
else await installMcpDependencies(${JSON.stringify(app)}, ${JSON.stringify(selection)});
`], { cwd: unrelated, env: { ...process.env, PATH: bin, COREPACK_ENABLE_NETWORK: '1', COREPACK_ENABLE_PROJECT_SPEC: '1', npm_config_manage_package_manager_versions: 'true' }, encoding: 'utf8' });
  const calls = async () => {
    try { return (await readFile(log, 'utf8')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  };
  return { root, app, run, calls };
}

for (const [name, candidates, expected, commands] of [
  ['installed pnpm without Corepack', { pnpm: {} }, installed, ['pnpm']],
  ['installed pnpm before available Corepack', { pnpm: {}, corepack: {} }, installed, ['pnpm']],
  ['wrong installed pnpm and cached Corepack', { pnpm: { version: '12.14.0' }, corepack: {} }, cached, ['pnpm', 'corepack']],
  ['unusable installed pnpm and cached Corepack', { pnpm: { fail: true }, corepack: {} }, cached, ['pnpm', 'corepack']],
  ['missing installed pnpm and cached Corepack', { corepack: {} }, cached, ['corepack']],
]) test(`Given ${name}, When read-only runtime selection runs, Then only exact pnpm 12.15.0 is selected without project switching`, async (t) => {
  const fixture = await runtimeFixture(t, candidates);
  const result = await fixture.run('select');
  assert.deepEqual(JSON.parse(result.stdout), expected);
  const calls = await fixture.calls();
  assert.deepEqual(calls.map((call) => call.command), commands);
  for (const call of calls) {
    assert.deepEqual(call.args, call.command === 'pnpm' ? ['--version'] : ['pnpm@12.15.0', '--version']);
    assert.equal(call.cwd, '/');
    assert.equal(call.env.COREPACK_ENABLE_NETWORK, '0');
    assert.equal(call.env.COREPACK_ENABLE_PROJECT_SPEC, '0');
    assert.equal(call.env.npm_config_manage_package_manager_versions, 'false');
  }
});

for (const [name, candidates] of [
  ['neither executable', {}],
  ['wrong versions for both executables', { pnpm: { version: '12.14.0' }, corepack: { version: '12.16.0' } }],
  ['wrong pnpm without Corepack', { pnpm: { version: '12.14.0' } }],
  ['unusable executables', { pnpm: { fail: true }, corepack: { fail: true } }],
]) test(`Given ${name}, When runtime selection runs, Then it explains exact preparation options without preparing or downloading tools`, async (t) => {
  const fixture = await runtimeFixture(t, candidates);
  await assert.rejects(fixture.run('select'), (error) => {
    assert.match(error.stderr, /pnpm 12\.15\.0/);
    assert.match(error.stderr, /PATH/);
    assert.match(error.stderr, /Corepack/);
    assert.match(error.stderr, /다운로드하거나 설치하지 않습니다/);
    return true;
  });
  for (const call of await fixture.calls()) {
    assert.equal(call.args.at(-1), '--version');
    assert.equal(call.cwd, '/');
    assert.equal(call.env.COREPACK_ENABLE_NETWORK, '0');
  }
});

for (const [name, candidates, selection] of [
  ['installed pnpm', { pnpm: {} }, installed],
  ['cached Corepack', { corepack: {} }, cached],
]) test(`Given ${name}, When dependency installation selects its runtime, Then frozen production dependencies install with lifecycle scripts and manager switching disabled`, async (t) => {
  const fixture = await runtimeFixture(t, candidates);
  await fixture.run('install');
  const calls = await fixture.calls();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].cwd, '/');
  assert.deepEqual(calls[0].args, [...selection.prefix, '--version']);
  assert.equal(calls[1].command, selection.command);
  assert.deepEqual(calls[1].args, [...selection.prefix, ...installArgs]);
  assert.equal(calls[1].cwd, fixture.app);
  assert.deepEqual(calls[1].env, { NODE_ENV: 'production', COREPACK_ENABLE_NETWORK: '0', COREPACK_ENABLE_PROJECT_SPEC: '0', npm_config_manage_package_manager_versions: 'false' });
});

test('Given an approved runtime from locked preflight, When installation runs, Then it uses that runtime without selecting a different candidate', async (t) => {
  const fixture = await runtimeFixture(t, { pnpm: {}, corepack: {} });
  await fixture.run('install', cached);
  const calls = await fixture.calls();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'corepack');
  assert.deepEqual(calls[0].args, [...cached.prefix, ...installArgs]);
});

for (const selection of [
  { command: '/untrusted/pnpm', prefix: [], version: '12.15.0' },
  { command: 'corepack', prefix: ['pnpm@99.0.0'], version: '12.15.0' },
  { command: 'pnpm', prefix: ['--dir=/untrusted'], version: '12.15.0' },
  { command: 'pnpm', prefix: [], version: '99.0.0' },
]) test(`Given untrusted runtime ${JSON.stringify(selection)}, When installation runs, Then no executable is called`, async (t) => {
  const fixture = await runtimeFixture(t, { pnpm: {}, corepack: {} });
  await assert.rejects(fixture.run('install', selection), (error) => {
    assert.match(error.stderr, /검증된 pnpm 12\.15\.0 실행 정보/);
    return true;
  });
  assert.deepEqual(await fixture.calls(), []);
});
