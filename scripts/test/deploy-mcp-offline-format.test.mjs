import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, link, lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { extractMcpDependencies, inspectMcpDependencies, MCP_DEPENDENCIES_FILE, packMcpDependencies, validateMcpOfflineManifest } from '../deploy-mcp-offline-format.mjs';
import { checkMcpStorage, measureMcpStorage, mcpDeploymentDemands, mcpTreeDemand } from '../deploy-mcp-storage.mjs';
import { inspectMcpTar } from '../deploy-mcp-tar.mjs';
import { tarBytes } from './deploy-mcp-fixture.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const storage = (destination, patch = {}) => ({ path: destination, dev: '1', frsize: '4096', bsize: '4096', blocks: '10000000', bavail: '9000000', files: '1000000', ffree: '900000', ...patch });
test('storage counts expanded tar payload, implicit directories, dependency links and the node_modules root', () => {
  const compressed = tarBytes([{ name: 'deep/implicit/blob', content: Buffer.alloc(4 * 1024 * 1024) }]);
  assert.ok(compressed.length < 8192);
  const inspected = inspectMcpTar(compressed);
  assert.deepEqual(mcpTreeDemand(inspected.entries), { bytes: '4194304', entries: '4' });
  assert.deepEqual(mcpTreeDemand([dir('pkg'), file('pkg/file', 'abc'), soft('link', 'pkg/file')], 'dependencies'), { bytes: '11', entries: '4' });
  const demands = mcpDeploymentDemands({ config: { remoteRoot: '/opt/mcp', unitDirectory: '/units' }, owner: 'owner', files: [{ name: 'app.tar.gz', bytes: compressed.length }] }, { app: inspected, archive: inspected, dependencies: { entries: [dir('pkg'), file('pkg/file', 'abc')] } });
  assert.ok(BigInt(demands.find((item) => item.path === '/opt/mcp/apps').bytes) >= 4194307n);
  assert.equal(demands.filter((item) => item.bytes === '4194304').length, 2);
});
test('storage groups allocation and inode demand by device, uses bavail and returns decimal strings', () => {
  const demands = [{ path: '/a', bytes: '4000', entries: '1' }, { path: '/b', bytes: '4000', entries: '1' }];
  assert.throws(() => checkMcpStorage(demands, [storage('/a', { bavail: '5' }), storage('/b', { bavail: '5' })]), /용량 부족/);
  assert.equal(checkMcpStorage(demands, [storage('/a', { bavail: '5' }), storage('/b', { dev: '2', bavail: '5' })]).length, 2);
  assert.throws(() => checkMcpStorage(demands, [storage('/a', { ffree: '1' }), storage('/b', { dev: '2' })]), /inode 부족/);
  assert.throws(() => checkMcpStorage(demands, [storage('/a', { bfree: '9000000', bavail: '0' }), storage('/b')]), /용량 부족/);
  const result = checkMcpStorage([{ path: '/a', bytes: '0', entries: '1' }], [storage('/a', { bsize: '8192' })]);
  assert.equal(result[0].requiredBytes, '19661');
  assert.equal(typeof result[0].availableBytes, 'string');
});
test('storage reserves the bounded root cleanup intent and its atomic write copy in every phase', () => {
  const plan = { config: { remoteRoot: '/opt/mcp', unitDirectory: '/units' }, owner: 'owner' };
  const inspected = { app: { entries: [] }, archive: { entries: [] } };
  for (const phase of ['bootstrap', 'transfer', 'extract']) {
    const root = mcpDeploymentDemands(plan, inspected, phase).find((item) => item.path === '/opt/mcp');
    assert.equal(BigInt(root.bytes), BigInt(Buffer.byteLength(JSON.stringify(plan))) * 8n + 2n * 64n * 1024n);
    assert.equal(root.entries, phase === 'bootstrap' ? '18' : '34');
  }
});
test('storage rejects unavailable, negative, zero-total and sentinel counters', () => {
  const demands = [{ path: '/a', bytes: '1', entries: '1' }];
  for (const patch of [{ files: '0' }, { ffree: '-1' }, { ffree: '18446744073709551615' }, { blocks: '0' }, { bavail: undefined }, { frsize: '0' }, { bsize: '0' }]) assert.throws(() => checkMcpStorage(demands, [storage('/a', patch)]), /검사 불가/);
});
test('storage measures the nearest existing real ancestor and refuses symlinks and concurrent replacement', async () => {
  const observed = [];
  const info = (patch = {}) => ({ dev: 7n, ino: 8n, isDirectory: () => true, isSymbolicLink: () => false, ...patch });
  const inspect = async (file) => { if (file.includes('missing')) throw Object.assign(new Error('missing'), { code: 'ENOENT' }); return info(); };
  const samples = await measureMcpStorage([{ path: '/exists/missing/nested' }], { lstat: inspect, statfs: async (file) => { observed.push(file); return { bsize: 4096n, frsize: 2048n, blocks: 100n, bavail: 50n, files: 100n, ffree: 80n }; } });
  assert.deepEqual(observed, ['/exists']);
  assert.equal(samples[0].frsize, '2048');
  await assert.rejects(measureMcpStorage([{ path: '/link/child' }], { lstat: async () => info({ isSymbolicLink: () => true }) }), /실제 디렉터리/);
  let replaced = false;
  await assert.rejects(measureMcpStorage([{ path: '/exists' }], { lstat: async () => info({ ino: replaced ? 9n : 8n }), statfs: async () => { replaced = true; return {}; } }), /바뀌었습니다/);
});
const file = (name, content = 'x') => ({ path: name, type: 'file', mode: 0o644, bytes: Buffer.byteLength(content), sha256: digest(content) });
const dir = (name) => ({ path: name, type: 'directory', mode: 0o755 });
const soft = (name, target) => ({ path: name, type: 'symlink', target });
function raw(entries, content = Buffer.alloc(0)) {
  const header = Buffer.from(JSON.stringify({ schemaVersion: 1, entries }));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(header.length);
  return gzipSync(Buffer.concat([Buffer.from('OWPMCPDEPS1\n'), length, header, content]));
}
function manifest(bytes) {
  const fingerprint = { bytes: bytes.length, sha256: digest(bytes) };
  return { schemaVersion: 1, target: 'linux-x64-glibc', head: 'a'.repeat(40), releaseId: '20261023-120000-aaaaaaaaaaaa', sourceSha256: 'b'.repeat(64), packageSha256: 'c'.repeat(64), lockSha256: 'd'.repeat(64), nodeVersion: '24.22.1', pnpmVersion: '12.16.1', nodeLinker: 'hoisted', files: { 'runtime-node': fingerprint, 'runtime-pnpm': fingerprint, [MCP_DEPENDENCIES_FILE]: fingerprint } };
}
async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-offline-format-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  await mkdir(source);
  return { root, source, destination: path.join(root, 'node_modules') };
}

test('Given hoisted dependencies, When packed and extracted, Then file bytes, executable modes and internal links survive without private metadata', async (t) => {
  const fixtureValue = await fixture(t);
  const { source, destination } = fixtureValue;
  await mkdir(path.join(source, 'pkg/bin'), { recursive: true });
  await mkdir(path.join(source, '.bin'));
  await mkdir(path.join(source, '.pnpm'));
  await writeFile(path.join(source, 'pkg/bin/tool.js'), '#!/usr/bin/env node\n');
  await chmod(path.join(source, 'pkg/bin/tool.js'), 0o751);
  await writeFile(path.join(source, 'pkg/package.json'), '{}');
  await link(path.join(source, 'pkg/package.json'), path.join(source, 'copied-package.json'));
  await symlink('../pkg/bin/tool.js', path.join(source, '.bin/tool'));
  await symlink('.bin/tool', path.join(source, 'tool-alias'));
  for (const name of ['.npmrc', '.modules.yaml', '.pnpm-workspace-state-v1.json', '.pnpm/lock.yaml', 'pkg/.npmrc']) await writeFile(path.join(source, name), 'private-token');
  const bytes = await packMcpDependencies(source);
  const inspected = inspectMcpDependencies(bytes, manifest(bytes));
  assert.equal(inspected.entries.filter((entry) => entry.type === 'file').length, 3);
  assert.ok(inspected.entries.every((entry) => !entry.path.includes('.npmrc') && !entry.path.includes('.pnpm') && entry.path !== '.modules.yaml'));
  assert.equal(inspected.entries.some((entry) => entry.content?.includes('private-token')), false);
  const result = await extractMcpDependencies(bytes, destination, manifest(bytes));
  assert.equal(result.entries, inspected.entries.length);
  assert.equal(await readFile(path.join(destination, '.bin/tool'), 'utf8'), '#!/usr/bin/env node\n');
  assert.equal(await readlink(path.join(destination, 'tool-alias')), '.bin/tool');
  assert.equal((await lstat(path.join(destination, 'pkg/bin/tool.js'))).mode & 0o777, 0o755);
  assert.equal((await lstat(path.join(destination, 'pkg/package.json'))).mode & 0o777, 0o644);
  assert.notEqual((await lstat(path.join(destination, 'pkg/package.json'))).ino, (await lstat(path.join(destination, 'copied-package.json'))).ino);
});

for (const [name, entries] of [
  ['traversal', [file('../outside')]], ['absolute', [file('/outside')]], ['backslash', [file('a\\b')]], ['control', [file('a\nb')]],
  ['duplicate', [file('same'), file('same')]], ['missing-parent', [file('missing/file')]],
  ['file-parent', [file('parent'), file('parent/file')]], ['symlink-parent', [dir('real'), soft('link', 'real'), file('link/file')]],
  ['absolute-link', [soft('link', '/tmp/outside')]], ['escaping-link', [soft('link', '../outside')]],
  ['missing-link', [soft('link', 'missing')]], ['self-cycle', [soft('link', 'link')]],
  ['indirect-cycle', [soft('one', 'two'), soft('two', 'one')]],
  ['prefix-cycle', [soft('one', 'two/file'), soft('two', 'one')]],
  ['expanded-parent-escape', [dir('a'), file('a/outside'), soft('a/alias', '..'), soft('link', 'a/alias/../outside')]],
  ['metadata', [file('.npmrc')]], ['special', [{ path: 'socket', type: 'socket' }]],
  ['mode', [{ ...file('file'), mode: 0o4777 }]], ['oversized', [{ ...file('file'), bytes: 256 * 1024 * 1024 + 1 }]],
]) test(`Given ${name}, When inspecting dependency bytes, Then validation fails before extraction`, () => {
  assert.throws(() => inspectMcpDependencies(raw(entries)));
});

test('Given a tampered file or blob length, When inspected, Then its digest and exact framing are enforced', () => {
  assert.throws(() => inspectMcpDependencies(raw([file('file')], Buffer.from('y'))), /SHA-256/);
  assert.throws(() => inspectMcpDependencies(raw([file('file')], Buffer.from('xx'))), /바이트/);
  assert.throws(() => inspectMcpDependencies(raw([file('file')], Buffer.alloc(0))), /SHA-256/);
  assert.throws(() => inspectMcpDependencies(gzipSync(Buffer.from('garbage'))), /형식/);
});

test('Given an offline manifest, When validated, Then exact versions, file limits and original bundle identity are required', () => {
  const bytes = raw([file('file')], Buffer.from('x'));
  const good = manifest(bytes);
  assert.equal(validateMcpOfflineManifest(good, { head: good.head, sourceSha256: good.sourceSha256 }), good);
  for (const patch of [{ target: 'darwin-arm64' }, { nodeVersion: '24.22.2' }, { pnpmVersion: '10.0.0' }, { nodeLinker: 'isolated' }, { releaseId: 123 }, { packageSha256: undefined }, { extra: true }]) assert.throws(() => validateMcpOfflineManifest({ ...good, ...patch }));
  assert.throws(() => validateMcpOfflineManifest(good, { head: 'f'.repeat(40) }), /원본/);
  assert.throws(() => validateMcpOfflineManifest({ ...good, files: { ...good.files, 'runtime-node': { bytes: 128 * 1024 * 1024 + 1, sha256: 'a'.repeat(64) } } }));
  const changed = Buffer.from(bytes);
  changed[10] ^= 1;
  assert.throws(() => inspectMcpDependencies(changed, good), /SHA-256/);
});

test('Given an existing extraction directory, When extracting, Then existing files are preserved', async (t) => {
  const { destination } = await fixture(t);
  await mkdir(destination);
  await writeFile(path.join(destination, 'keep'), 'keep');
  const bytes = raw([file('file')], Buffer.from('x'));
  await assert.rejects(extractMcpDependencies(bytes, destination, manifest(bytes)), { code: 'EEXIST' });
  assert.equal(await readFile(path.join(destination, 'keep'), 'utf8'), 'keep');
});

test('Given a symlink dependency root or an escaping installed link, When packing, Then it is rejected', async (t) => {
  const { root, source } = await fixture(t);
  await symlink(source, path.join(root, 'linked'));
  await assert.rejects(packMcpDependencies(path.join(root, 'linked')), /실제 디렉터리/);
  await symlink('../outside', path.join(source, 'escape'));
  await assert.rejects(packMcpDependencies(source), /루트 밖/);
});

test('Given an extraction parent symlink, When extracting, Then no directory is created through it', async (t) => {
  const { root, source } = await fixture(t);
  await symlink(source, path.join(root, 'alias'));
  const bytes = raw([file('file')], Buffer.from('x'));
  await assert.rejects(extractMcpDependencies(bytes, path.join(root, 'alias/node_modules'), manifest(bytes)), /실제 디렉터리/);
  await assert.rejects(lstat(path.join(source, 'node_modules')), { code: 'ENOENT' });
});

test('Given an excessively deep link graph, When inspecting, Then validation is bounded', () => {
  const entries = [file('target')];
  for (let index = 0; index < 130; index += 1) entries.push(soft(`link-${index}`, index === 129 ? 'target' : `link-${index + 1}`));
  assert.throws(() => inspectMcpDependencies(raw(entries, Buffer.from('x'))), /깊이 상한/);
});
