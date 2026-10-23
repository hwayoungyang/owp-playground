import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { archivePlaygroundBuild } from '../version-archive-write.ts';
import { writeBuild } from './version-archive-fixture.mjs';
import { sha256 } from '../deploy-mcp-tar.mjs';
import { validateMcpConfig } from '../deploy-mcp-config.mjs';

const execute = promisify(execFile);
const repo = path.resolve(new URL('../../', import.meta.url).pathname);
export const head = '0123456789abcdef0123456789abcdef01234567';
export function tarBytes(entries, comment = head) {
  const blocks = [];
  const append = (name, content, type = '0') => {
    const bytes = Buffer.from(content);
    const header = Buffer.alloc(512);
    header.write(name, 0, 100);
    header.write('0000644\0', 100, 8);
    header.write('0000000\0', 108, 8);
    header.write('0000000\0', 116, 8);
    header.write(`${bytes.length.toString(8).padStart(11, '0')}\0`, 124, 12);
    header.write('00000000000\0', 136, 12);
    header.fill(32, 148, 156);
    header.write(type, 156, 1);
    header.write('ustar\0', 257, 6);
    header.write('00', 263, 2);
    const sum = [...header].reduce((a, b) => a + b, 0);
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 8);
    blocks.push(header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512));
  };
  if (comment) {
    const line = `comment=${comment}\n`;
    let length = Buffer.byteLength(line) + 3;
    while (length !== Buffer.byteLength(line) + String(length).length + 1) length = Buffer.byteLength(line) + String(length).length + 1;
    append('pax_global_header', `${length} ${line}`, 'g');
  }
  for (const entry of entries) append(entry.name, entry.content ?? '', entry.type);
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}
export async function directoryEntries(directory, prefix = '') {
  const entries = [];
  for (const name of (await readdir(path.join(directory, prefix))).sort()) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const file = path.join(directory, relative);
    if ((await lstat(file)).isDirectory()) entries.push(...await directoryEntries(directory, relative));
    else entries.push({ name: relative, content: await readFile(file) });
  }
  return entries;
}
const appFiles = [
  'mcp/cli.ts', 'package.json', 'pnpm-lock.yaml', 'scripts/version-archive.ts', 'scripts/version-archive-files.ts',
  'scripts/version-archive-build.ts', 'scripts/version-archive-write.ts', 'src/features/releases/model/schema.ts',
  'src/features/api/model/schema.ts', 'src/features/api/model/package-data.ts', 'src/features/code/code-location.ts', 'src/playgrounds/packages.ts',
];
export async function mcpFixture(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-mcp-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const config = validateMcpConfig({ host: '127.0.0.1', remoteRoot: path.join(root, 'server'), unitDirectory: path.join(root, 'units'), url: 'http://127.0.0.1:30011' });
  await mkdir(config.unitDirectory);
  const sourceEntries = await Promise.all(appFiles.map(async (name) => ({ name, content: await readFile(path.join(repo, name)) })));
  const bundle = path.join(root, 'bundle');
  await mkdir(bundle);
  const fixture = { root, config, bundle, sourceEntries, archiveRoot: path.join(root, 'archive'), repo };
  await writeMcpFixtureBundle(fixture);
  return fixture;
}
export async function writeMcpFixtureBundle(fixture, options = {}) {
  const releaseId = options.releaseId ?? `20261023-120000-${head.slice(0, 12)}`;
  const metadata = { schemaVersion: 1, releaseId, createdAt: options.createdAt ?? '2026-10-23T03:00:00.000Z', appVersion: '0.1.0', commit: head.slice(0, 12), dirty: false, channel: 'stable', basePath: `/versions/${releaseId}/` };
  const build = path.join(fixture.root, `build-${releaseId}`);
  await writeBuild(build, metadata);
  await archivePlaygroundBuild({ archiveRoot: fixture.archiveRoot, directory: build, release: metadata });
  const app = tarBytes(options.sourceEntries ?? fixture.sourceEntries, options.comment ?? head);
  const archive = tarBytes(await directoryEntries(fixture.archiveRoot), undefined);
  const index = JSON.parse(await readFile(path.join(fixture.archiveRoot, 'versions/index.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(fixture.archiveRoot, `versions/${releaseId}/knowledge-release.json`), 'utf8'));
  const release = { head, releaseId, manifestCommit: metadata.commit, dirty: false, channel: 'stable', packages: manifest.packages, stableReleaseIds: index.releases.map((entry) => entry.releaseId), files: { 'app.tar.gz': { bytes: app.length, sha256: sha256(app) }, 'archive.tar.gz': { bytes: archive.length, sha256: sha256(archive) } } };
  await writeFile(path.join(fixture.bundle, 'app.tar.gz'), app);
  await writeFile(path.join(fixture.bundle, 'archive.tar.gz'), archive);
  await writeFixtureMetadata(fixture.bundle, release);
  return release;
}
export async function writeFixtureMetadata(bundle, release) {
  await writeFile(path.join(bundle, 'release.json'), JSON.stringify(release));
  await writeFile(path.join(bundle, 'SHA256SUMS'), `${Object.entries(release.files).map(([name, file]) => `${file.sha256}  ${name}`).join('\n')}\n`);
}
export async function stageMcpFixture(fixture, prepared, owner = '11111111-1111-4111-8111-111111111111') {
  const incoming = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
  await mkdir(path.join(fixture.config.remoteRoot, '.deploy.lock'), { recursive: true });
  await writeFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), owner);
  await mkdir(incoming);
  await writeFile(path.join(incoming, 'owner'), owner);
  for (const file of prepared.transferFiles) await cp(path.join(prepared.directory, file.name), path.join(incoming, file.name));
  return { config: fixture.config, owner, incoming, metadata: prepared.metadata, files: prepared.transferFiles };
}
export async function systemShim(fixture) {
  const shim = path.join(fixture.root, 'service-shim.mjs');
  const statePath = path.join(fixture.root, 'service-state.json');
  await writeFile(statePath, JSON.stringify({ active: 'inactive', enabled: 'disabled', calls: [] }));
  await writeFile(shim, `import{readFile,writeFile,lstat}from'node:fs/promises';const [,,file,unitPath,command,...args]=process.argv;const s=JSON.parse(await readFile(file));s.calls.push([command,...args]);let present=false;try{present=(await lstat(unitPath)).isFile()}catch{};let out='';if(command==='corepack'){if(s.runtimeFail)process.exit(2);out='12.15.0'}else if(command==='ss'){out=s.portBusy?'LISTEN pid=999,':''}else{const op=args[0];if(op==='--version')out='systemd 252';else if(op==='show'){const p=args.find(x=>x.startsWith('--property='))?.slice(11);out=({LoadState:present?'loaded':'not-found',FragmentPath:unitPath,DropInPaths:s.dropins??'',UnitPath:unitPath.slice(0,unitPath.lastIndexOf('/')),MainPID:'100',ActiveState:s.active,UnitFileState:s.enabled})[p]??'';}else if(op==='stop'){if(!present)process.exit(3);s.active='inactive'}else if(op==='disable'){if(!present)process.exit(4);s.enabled='disabled'}else if(op==='enable'){if(!present)process.exit(5);s.enabled='enabled'}else if(op==='start'||op==='restart'){if(!present||s.startFail){await writeFile(file,JSON.stringify(s));process.exit(6)}s.active='active'}}await writeFile(file,JSON.stringify(s));process.stdout.write(out);`);
  const run = async (command, args) => (await execute(process.execPath, [shim, statePath, path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`), command, ...args], { encoding: 'utf8' })).stdout;
  const state = async (patch) => {
    const value = JSON.parse(await readFile(statePath, 'utf8'));
    if (patch) await writeFile(statePath, JSON.stringify({ ...value, ...patch }));
    return { ...value, ...patch };
  };
  return { run, state, preflight: { run, nodeVersion: 'v24.22.1', nodePath: '/usr/bin/true' }, install: async (directory) => symlink(path.join(fixture.repo, 'node_modules'), path.join(directory, 'node_modules')) };
}
