import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
export const managedMarker = '# OWP-MCP-DEPLOY-MANAGED v1';
export const hashContent = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const optionalStat = async (file) => {
  try { return await lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
};
export async function assertRealAncestors(directory) {
  let current = path.parse(directory).root;
  for (const name of directory.slice(current.length).split(path.sep)) {
    current = path.join(current, name);
    const info = await optionalStat(current);
    if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error(`실제 디렉터리가 필요합니다: ${current}`);
  }
}
export function mcpPackageManagerEnvironment() {
  return { ...process.env, COREPACK_ENABLE_NETWORK: '0', COREPACK_ENABLE_PROJECT_SPEC: '0', npm_config_manage_package_manager_versions: 'false' };
}
export async function capture(command, args, options = {}) {
  try { return (await execute(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024, cwd: options.cwd, env: { ...mcpPackageManagerEnvironment(), ...options.env } })).stdout.trim(); }
  catch (error) { throw new Error(`${command} 준비 상태를 확인하지 못했습니다. 필요한 런타임을 서버에 먼저 준비해 주세요.`, { cause: error }); }
}
export async function selectMcpPackageManager(run = capture) {
  for (const candidate of [{ command: 'pnpm', prefix: [], version: '12.15.0' }, { command: 'corepack', prefix: ['pnpm@12.15.0'], version: '12.15.0' }]) {
    try {
      if (await run(candidate.command, [...candidate.prefix, '--version'], { cwd: '/', env: mcpPackageManagerEnvironment() }) === candidate.version) return candidate;
    } catch { /* 설치된 실행 파일 또는 캐시를 사용할 수 없으면 다음 후보를 확인한다. */ }
  }
  throw new Error('서버 pnpm 12.15.0이 필요합니다. PATH에 pnpm 12.15.0을 설치하거나, 선택적으로 Corepack에 pnpm@12.15.0을 미리 캐시해 주세요. 사전 점검은 도구를 다운로드하거나 설치하지 않습니다.');
}

export async function inspectMcpRuntime(config, runtime, run = capture) {
  const pattern = new RegExp(`^${config.remoteRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/runtime/node24\\.22\\.1-pnpm12\\.15\\.0-([a-f0-9]{64})-([a-f0-9]{64})$`);
  const match = typeof runtime?.directory === 'string' ? pattern.exec(runtime.directory) : undefined;
  if (!match || runtime.nodeSha256 !== match[1] || runtime.pnpmSha256 !== match[2] || runtime.node !== `${runtime.directory}/bin/node` || runtime.packageManager?.command !== `${runtime.directory}/bin/pnpm` || runtime.packageManager.version !== '12.15.0' || !Array.isArray(runtime.packageManager.prefix) || runtime.packageManager.prefix.length) throw new Error('배포 전용 런타임 경로 또는 버전이 올바르지 않습니다.');
  await assertRealAncestors(path.join(runtime.directory, 'bin'));
  for (const [name, expected] of [['node', match[1]], ['pnpm', match[2]]]) {
    const file = path.join(runtime.directory, 'bin', name);
    const info = await optionalStat(file);
    if (!info?.isFile() || info.isSymbolicLink() || info.size > 256 * 1024 * 1024 || hashContent(await readFile(file)) !== expected) throw new Error(`배포 전용 런타임 파일이 변경됐습니다: ${name}`);
  }
  if (await run(runtime.packageManager.command, ['--version'], { cwd: '/', env: { PATH: `${runtime.directory}/bin:/usr/sbin:/usr/bin:/sbin:/bin` } }) !== '12.15.0') throw new Error('배포 전용 pnpm 12.15.0 실행 검증에 실패했습니다.');
  return runtime.packageManager;
}

export async function assertMcpUnitConfiguration(config, run = capture) {
  const unit = `${config.service}.service`;
  const fragment = await run('systemctl', ['show', unit, '--property=FragmentPath', '--value']);
  const dropins = await run('systemctl', ['show', unit, '--property=DropInPaths', '--value']);
  if (fragment !== path.join(config.unitDirectory, unit) || dropins) throw new Error('service fragment 또는 drop-in 설정이 예상과 다릅니다.');
}
export async function assertMcpDropInDirectories(config, run = capture) {
  const search = await run('systemctl', ['show', '--property=UnitPath', '--value']);
  const directories = search.split(/\s+/).filter(Boolean);
  if (!directories.length || directories.some((directory) => !/^\/[A-Za-z0-9_./+-]+$/.test(directory))) throw new Error('systemd unit 검색 경로를 안전하게 확인하지 못했습니다.');
  const names = [`${config.service}.service.d`, 'service.d'];
  const parts = config.service.split('-');
  while (parts.length > 1) { parts.pop(); names.push(`${parts.join('-')}-.service.d`); }
  for (const directory of new Set([...directories, config.unitDirectory])) {
    for (const name of names) {
      const location = path.join(directory, name);
      const info = await optionalStat(location);
      if (!info) continue;
      if (!info.isDirectory() || info.isSymbolicLink() || (await readdir(location)).some((file) => file.endsWith('.conf'))) throw new Error(`관리되지 않은 systemd drop-in을 거부했습니다: ${location}`);
    }
  }
}

export async function inspectMcpServer(config, dependencies = {}) {
  const run = dependencies.run ?? capture;
  const version = dependencies.nodeVersion ?? process.version;
  if (version !== 'v24.22.1') throw new Error('서버 Node 24.22.1이 필요합니다. OS 런타임은 자동 설치하지 않습니다.');
  const node = await realpath(dependencies.nodePath ?? process.execPath);
  if (!/^\/[A-Za-z0-9_./+-]+$/.test(node)) throw new Error('Node binary 절대 경로가 안전하지 않습니다.');
  if (dependencies.runtime && node !== dependencies.runtime.node) throw new Error('배포 전용 Node 실행 경로가 다릅니다.');
  const packageManager = dependencies.runtime ? await inspectMcpRuntime(config, dependencies.runtime, run) : await selectMcpPackageManager(run);
  await run('systemctl', ['--version']);
  await run('sha256sum', ['--version']);
  await assertMcpDropInDirectories(config, run);
  const unitName = `${config.service}.service`;
  const unitPath = path.join(config.unitDirectory, unitName);
  const root = config.remoteRoot;
  await assertRealAncestors(root);
  await assertRealAncestors(config.unitDirectory);
  for (const name of ['apps', 'archive', 'archive/versions']) await assertRealAncestors(path.join(root, name));
  const lock = await optionalStat(path.join(root, '.deploy.lock'));
  if (lock && (!dependencies.lockOwner || !lock.isDirectory() || lock.isSymbolicLink() || (await readFile(path.join(root, '.deploy.lock/owner'), 'utf8')) !== dependencies.lockOwner)) throw new Error(`다른 배포가 진행 중이거나 잠금이 남아 있습니다: ${root}/.deploy.lock`);
  const env = await optionalStat(path.join(root, 'mcp.env'));
  if (env && (!env.isFile() || env.isSymbolicLink())) throw new Error('mcp.env에는 일반 파일이 필요합니다.');
  const unit = await optionalStat(unitPath);
  const current = await optionalStat(path.join(root, 'current'));
  const receiptFile = path.join(root, 'deployment.json');
  const receiptInfo = await optionalStat(receiptFile);
  const loadState = await run('systemctl', ['show', unitName, '--property=LoadState', '--value']);
  let receipt;
  if (unit) {
    if (!unit.isFile() || unit.isSymbolicLink() || !receiptInfo?.isFile() || receiptInfo.isSymbolicLink() || !current?.isSymbolicLink()) throw new Error('이 CLI가 관리하지 않는 기존 unit·current·receipt를 거부했습니다.');
    const content = await readFile(unitPath, 'utf8');
    receipt = JSON.parse(await readFile(receiptFile, 'utf8'));
    if (!content.startsWith(`${managedMarker}\n`) || receipt.schemaVersion !== 1 || receipt.root !== root || receipt.url !== config.url || receipt.service !== config.service || receipt.unitSha256 !== hashContent(content) || !/^[0-9a-f]{40}$/.test(receipt.head) ||
        !receipt.appDirectory?.startsWith(`${root}/apps/`) || !/^[A-Za-z0-9._-]+$/.test(path.basename(receipt.appDirectory)) || await realpath(path.join(root, 'current')) !== receipt.appDirectory) throw new Error('관리 unit 또는 deployment receipt가 변경됐습니다. 기존 설정을 덮어쓰지 않습니다.');
    await assertRealAncestors(receipt.appDirectory);
    if (loadState !== 'loaded') throw new Error('관리 service의 systemd LoadState가 loaded가 아닙니다.');
    await assertMcpUnitConfiguration(config, run);
  } else if (current || receiptInfo || loadState !== 'not-found') throw new Error('이 CLI가 관리하지 않는 기존 service·current·receipt를 거부했습니다.');
  const listeners = await run('ss', ['-H', '-ltnp', `sport = :${config.listenPort}`]);
  if (listeners) {
    if (!receipt) throw new Error(`MCP port ${config.listenPort}를 다른 프로세스가 사용 중입니다.`);
    const pid = await run('systemctl', ['show', unitName, '--property=MainPID', '--value']);
    if (!/^[1-9][0-9]*$/.test(pid) || listeners.split('\n').some((line) => !line.includes(`pid=${pid},`))) throw new Error('MCP port 소유 프로세스와 관리 service가 다릅니다.');
  }
  const active = receipt ? await run('systemctl', ['show', unitName, '--property=ActiveState', '--value']) : 'inactive';
  const enabled = receipt ? await run('systemctl', ['show', unitName, '--property=UnitFileState', '--value']) : 'disabled';
  if (!['active', 'inactive', 'failed'].includes(active) || !['enabled', 'disabled'].includes(enabled)) throw new Error('현재 service active/enabled 상태를 안전하게 복원할 수 없습니다.');
  let previousManifest;
  if (receipt) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(receipt.releaseId)) throw new Error('이전 receipt releaseId가 올바르지 않습니다.');
    const manifestPath = path.join(root, 'archive/versions', receipt.releaseId, 'knowledge-release.json');
    await assertRealAncestors(path.dirname(manifestPath));
    const manifestInfo = await optionalStat(manifestPath);
    if (!manifestInfo?.isFile() || manifestInfo.isSymbolicLink()) throw new Error('이전 manifest 파일이 올바르지 않습니다.');
    previousManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (previousManifest.releaseId !== receipt.releaseId || !receipt.head.startsWith(previousManifest.commit)) throw new Error('이전 receipt와 manifest 정보가 다릅니다.');
  }
  return { node, packageManager, receipt, previousManifest, active, enabled, unitPath };
}
