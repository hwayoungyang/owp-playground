import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { assertMcpLinuxExecutable, extractMcpRuntimeMember, MCP_OFFLINE_RUNTIMES, prepareMcpOffline, prepareMcpRuntimes } from '../deploy-mcp-offline.mjs';
import { inspectMcpDependencies } from '../deploy-mcp-offline-format.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
function elf() {
  const bytes = Buffer.alloc(64);
  bytes.writeUInt32BE(0x7f454c46, 0);
  bytes[4] = 2;
  bytes[5] = 1;
  bytes[6] = 1;
  bytes.writeUInt16LE(2, 16);
  bytes.writeUInt16LE(62, 18);
  return bytes;
}
const runtimes = async () => ({ 'runtime-node': elf(), 'runtime-pnpm': elf() });
async function fixture(t) {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-offline-test-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const app = path.join(directory, 'app');
  await mkdir(app);
  await writeFile(path.join(app, 'package.json'), '{"name":"fixture","packageManager":"pnpm@12.15.0"}\n');
  await writeFile(path.join(app, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n---\nlockfileVersion: 9\n');
  await writeFile(path.join(app, 'pnpm-workspace.yaml'), 'packages:\n  - .\n');
  await writeFile(path.join(app, '.npmrc'), '//private.example/:_authToken=local-secret\n');
  const bundle = { directory, metadata: { head: 'a'.repeat(40), releaseId: '20261023-120000-aaaaaaaaaaaa', files: { 'app.tar.gz': { sha256: 'b'.repeat(64) } } }, transferFiles: [{ name: 'app.tar.gz', bytes: 3, sha256: 'b'.repeat(64) }] };
  return { directory, app, bundle };
}
async function installFixture(command, args, options) {
  if (args.includes('--version')) return '12.15.0\n';
  await mkdir(path.join(options.cwd, 'node_modules/pkg'), { recursive: true });
  await writeFile(path.join(options.cwd, 'node_modules/pkg/package.json'), '{"name":"pkg"}');
  return '';
}
function tar(entries) {
  const blocks = [];
  for (const entry of entries) {
    const block = Buffer.alloc(512);
    block.write(entry.name, 0, 100);
    block.write('0000755\0', 100);
    block.write(`${entry.bytes.length.toString(8).padStart(11, '0')}\0`, 124);
    block.write('        ', 148);
    block.write(entry.type ?? '0', 156);
    block.write('ustar\0', 257);
    block.write(`${[...block].reduce((sum, value) => sum + value, 0).toString(8).padStart(6, '0')}\0 `, 148);
    blocks.push(block, entry.bytes, Buffer.alloc((512 - entry.bytes.length % 512) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

test('Given a frozen bundle, When offline artifacts are prepared, Then Linux production flags and immutable multi-document source settings are enforced', async (t) => {
  const { bundle, app } = await fixture(t);
  const original = await readFile(path.join(app, 'pnpm-lock.yaml'));
  const calls = [];
  const run = async (command, args, options) => {
    calls.push({ command, args, cwd: options.cwd, env: options.env });
    return installFixture(command, args, options);
  };
  const oldFiles = JSON.stringify(bundle.transferFiles);
  const result = await prepareMcpOffline(bundle, { run, prepareRuntime: runtimes });
  assert.equal(JSON.stringify(bundle.transferFiles), oldFiles);
  assert.deepEqual(await readFile(path.join(app, 'pnpm-lock.yaml')), original);
  assert.equal(result.manifest.lockSha256, digest(original));
  assert.equal(result.manifest.sourceSha256, bundle.metadata.files['app.tar.gz'].sha256);
  assert.equal(result.manifest.workspaceSha256, digest(await readFile(path.join(app, 'pnpm-workspace.yaml'))));
  assert.deepEqual(result.transferFiles.map((entry) => entry.name), ['runtime-node', 'runtime-pnpm', 'dependencies.bin.gz', 'offline.json']);
  for (const file of result.transferFiles) {
    const bytes = await readFile(path.join(bundle.directory, file.name));
    assert.equal(file.bytes, bytes.length);
    assert.equal(file.sha256, digest(bytes));
  }
  const invocation = calls.find((call) => call.args.includes('install'));
  assert.deepEqual(invocation.args.slice(0, -1), ['install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--ignore-pnpmfile', '--no-runtime', '--os', 'linux', '--cpu', 'x64', '--libc', 'glibc', '--node-linker=hoisted', '--config.package-import-method=copy', '--config.manage-package-manager-versions=false']);
  assert.notEqual(invocation.cwd, app);
  assert.equal(calls[0].cwd, path.parse(app).root);
  assert.equal(calls[0].env.COREPACK_ENABLE_PROJECT_SPEC, '0');
  assert.equal(calls[0].env.npm_config_manage_package_manager_versions, 'false');
  assert.ok(invocation.args.at(-1).startsWith(`--store-dir=${path.dirname(invocation.cwd)}/store`));
  await assert.rejects(lstat(path.dirname(invocation.cwd)), { code: 'ENOENT' });
  const inspected = inspectMcpDependencies(await readFile(path.join(bundle.directory, 'dependencies.bin.gz')), result.manifest);
  assert.deepEqual(inspected.entries.map((entry) => entry.path), ['pkg', 'pkg/package.json']);
});

test('Given only cached Corepack pnpm 12.15.0, When preparing, Then its exact version is selected without network version lookup', async (t) => {
  const { bundle } = await fixture(t);
  const calls = [];
  await prepareMcpOffline(bundle, { prepareRuntime: runtimes, run: async (command, args, options) => {
    calls.push({ command, args, options });
    if (command === 'pnpm') throw new Error('unavailable');
    return installFixture(command, args, options);
  } });
  assert.deepEqual(calls[1].args, ['pnpm@12.15.0', '--version']);
  assert.equal(calls[1].options.env.COREPACK_ENABLE_NETWORK, '0');
  assert.deepEqual(calls[2].args.slice(0, 2), ['pnpm@12.15.0', 'install']);
});

for (const mutation of ['changed-lock', 'install-failure', 'wrong-version', 'invalid-runtime']) test(`Given ${mutation}, When preparing, Then no artifact is published and the private stage is removed`, async (t) => {
  const { bundle, app } = await fixture(t);
  let stage;
  const original = await readFile(path.join(app, 'pnpm-lock.yaml'));
  const run = async (command, args, options) => {
    if (args.includes('--version')) return mutation === 'wrong-version' ? '11.0.0' : '12.15.0';
    stage = path.dirname(options.cwd);
    if (mutation === 'install-failure') throw new Error('installation failed');
    if (mutation === 'changed-lock') await writeFile(path.join(options.cwd, 'pnpm-lock.yaml'), 'changed');
    return installFixture(command, args, options);
  };
  await assert.rejects(prepareMcpOffline(bundle, { run, prepareRuntime: mutation === 'invalid-runtime' ? async () => ({ 'runtime-node': Buffer.from('Mach-O'), 'runtime-pnpm': elf() }) : runtimes }));
  assert.deepEqual(await readFile(path.join(app, 'pnpm-lock.yaml')), original);
  for (const name of ['runtime-node', 'runtime-pnpm', 'dependencies.bin.gz', 'offline.json']) await assert.rejects(lstat(path.join(bundle.directory, name)), { code: 'ENOENT' });
  if (stage) await assert.rejects(lstat(stage), { code: 'ENOENT' });
});

test('Given a previously published artifact, When preparation is retried, Then it is preserved and installation does not start', async (t) => {
  const { bundle } = await fixture(t);
  await writeFile(path.join(bundle.directory, 'runtime-node'), 'keep');
  await assert.rejects(prepareMcpOffline(bundle, { run: async () => { assert.fail('installation must not start'); }, prepareRuntime: runtimes }), /이미 있습니다/);
  assert.equal(await readFile(path.join(bundle.directory, 'runtime-node'), 'utf8'), 'keep');
});

test('Given a pinned runtime tar with unrelated links, When selecting its executable, Then only the one exact regular member is extracted', () => {
  const spec = MCP_OFFLINE_RUNTIMES['runtime-node'];
  const bytes = elf();
  const compressed = tar([{ name: 'unrelated/link', bytes: Buffer.alloc(0), type: '2' }, { name: spec.member, bytes }]);
  assert.deepEqual(extractMcpRuntimeMember(compressed, spec.member, 128), bytes);
  assert.throws(() => extractMcpRuntimeMember(tar([{ name: spec.member, bytes, type: '2' }]), spec.member, 128));
  assert.throws(() => extractMcpRuntimeMember(tar([{ name: spec.member, bytes }, { name: spec.member, bytes }]), spec.member, 128));
  assert.throws(() => extractMcpRuntimeMember(compressed, spec.member, 32));
  assert.throws(() => extractMcpRuntimeMember(compressed, 'wrong-member', 128));
  const arm = Buffer.from(bytes);
  arm.writeUInt16LE(183, 18);
  assert.throws(() => assertMcpLinuxExecutable(arm), /ELF x86_64/);
  assert.throws(() => assertMcpLinuxExecutable(Buffer.from('Mach-O')), /ELF x86_64/);
});

test('Given a tampered runtime cache, When preparing runtimes, Then cached bytes fail closed without redownloading', async (t) => {
  const { directory } = await fixture(t);
  const cacheDirectory = path.join(directory, 'cache');
  await mkdir(cacheDirectory);
  await writeFile(path.join(cacheDirectory, MCP_OFFLINE_RUNTIMES['runtime-node'].cacheName), 'forged');
  await assert.rejects(prepareMcpRuntimes({ cacheDirectory, download: () => assert.fail('tampered cache must not be replaced') }), /SHA-256/);
});

test('Given a symlink in the cache parent path, When preparing runtimes, Then no directory is created through the link', async (t) => {
  const { directory } = await fixture(t);
  const target = path.join(directory, 'outside');
  await mkdir(target);
  await symlink(target, path.join(directory, 'alias'));
  await assert.rejects(prepareMcpRuntimes({ cacheDirectory: path.join(directory, 'alias/new-cache'), download: () => assert.fail('must not download') }), /symlink/);
  await assert.rejects(lstat(path.join(target, 'new-cache')), { code: 'ENOENT' });
});

test('Given invalid downloaded runtime bytes, When preparing, Then the unverified archive is not cached', async (t) => {
  const { directory } = await fixture(t);
  const cacheDirectory = path.join(directory, 'cache');
  const urls = [];
  await assert.rejects(prepareMcpRuntimes({ cacheDirectory, download: async (url) => { urls.push(url); return Buffer.from('forged'); } }), /SHA-256/);
  assert.deepEqual(urls, [MCP_OFFLINE_RUNTIMES['runtime-node'].url]);
  await assert.rejects(lstat(path.join(cacheDirectory, MCP_OFFLINE_RUNTIMES['runtime-node'].cacheName)), { code: 'ENOENT' });
});
