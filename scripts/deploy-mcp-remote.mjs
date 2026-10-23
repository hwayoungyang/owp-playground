import { execFile } from 'node:child_process';
import { mkdir, readFile, readlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { validateMcpConfig } from './deploy-mcp-config.mjs';
import { inspectMcpServer, optionalStat, hashContent, assertMcpUnitConfiguration, selectMcpPackageManager, mcpPackageManagerEnvironment } from './deploy-mcp-preflight.mjs';
import { extractMcpTar, inspectMcpTar, sha256 } from './deploy-mcp-tar.mjs';
import { prepareMcpArchiveMerge } from './deploy-mcp-archive.mjs';
import { renderMcpUnit } from './deploy-mcp-unit.mjs';
import { assertMcpOwner, atomicMcpFile, atomicMcpLink, saveMcpTransaction, rollbackMcpTransaction, commitMcpTransaction, finalizeMcpRollback } from './deploy-mcp-transaction.mjs';
import { validateMcpOfflineManifest, extractMcpDependencies, MCP_DEPENDENCIES_FILE } from './deploy-mcp-offline-format.mjs';

const execute = promisify(execFile);
async function serviceStartupError(run, unit, cause) {
  let details = '상세 상태를 확인하지 못했습니다';
  try {
    const output = await run('systemctl', ['show', unit, '--property=ActiveState', '--property=SubState', '--property=Result', '--property=ExecMainStatus']);
    const fields = output.slice(0, 4096).split('\n').filter((line) => /^(ActiveState|SubState|Result|ExecMainStatus)=[A-Za-z0-9_.-]{1,64}$/.test(line));
    if (fields.length) details = fields.join(', ');
  } catch { /* 시작 실패를 유지하며 상태 조회 실패를 별도로 안내한다. */ }
  return new Error(`MCP 서비스 시작에 실패했습니다 (${details}). 로그 확인: journalctl -u ${unit} -n 100 --no-pager -o cat`, cause ? { cause } : undefined);
}
export async function installMcpDependencies(appDirectory, selection) {
  const packageManager = selection ?? await selectMcpPackageManager();
  const installed = packageManager.command === 'pnpm' && Array.isArray(packageManager.prefix) && packageManager.prefix.length === 0;
  const cached = packageManager.command === 'corepack' && Array.isArray(packageManager.prefix) && packageManager.prefix.length === 1 && packageManager.prefix[0] === 'pnpm@12.15.0';
  if (packageManager.version !== '12.15.0' || (!installed && !cached)) throw new Error('검증된 pnpm 12.15.0 실행 정보가 필요합니다.');
  try {
    await execute(installed ? 'pnpm' : 'corepack', [...(cached ? ['pnpm@12.15.0'] : []), 'install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--config.manage-package-manager-versions=false'], {
      cwd: appDirectory, env: { ...mcpPackageManagerEnvironment(), NODE_ENV: 'production' }, timeout: 10 * 60 * 1000, maxBuffer: 4 * 1024 * 1024,
    });
  } catch (cause) { throw new Error('prod frozen dependency 설치에 실패했습니다. 준비된 pnpm·registry·lockfile을 확인해 주세요.', { cause }); }
}
export async function installMcpOfflineDependencies(appDirectory, context) {
  const expected = {
    head: context.metadata.head, releaseId: context.metadata.releaseId,
    sourceSha256: context.metadata.files['app.tar.gz'].sha256,
    packageSha256: sha256(await readFile(path.join(appDirectory, 'package.json'))),
    lockSha256: sha256(await readFile(path.join(appDirectory, 'pnpm-lock.yaml'))),
    workspaceSha256: undefined,
  };
  const workspace = path.join(appDirectory, 'pnpm-workspace.yaml');
  if (await optionalStat(workspace)) expected.workspaceSha256 = sha256(await readFile(workspace));
  const manifest = validateMcpOfflineManifest(JSON.parse(await readFile(path.join(context.incoming, 'offline.json'), 'utf8')), expected);
  if (JSON.stringify(manifest) !== JSON.stringify(validateMcpOfflineManifest(context.offline, expected))) throw new Error('수신 오프라인 manifest와 배포 계획이 다릅니다.');
  if (context.runtime && (context.runtime.nodeSha256 !== manifest.files['runtime-node'].sha256 || context.runtime.pnpmSha256 !== manifest.files['runtime-pnpm'].sha256)) throw new Error('설치한 런타임과 오프라인 manifest의 SHA-256이 다릅니다.');
  return extractMcpDependencies(await readFile(path.join(context.incoming, MCP_DEPENDENCIES_FILE)), path.join(appDirectory, 'node_modules'), manifest);
}
export async function activateMcpDeployment(context, dependencies = {}) {
  await assertMcpOwner(context);
  const { config, incoming, owner, metadata, files } = context;
  for (const entry of files) {
    const location = path.join(incoming, entry.name);
    const info = await optionalStat(location);
    if (!/^[A-Za-z0-9_.-]+$/.test(entry.name) || !info?.isFile() || info.isSymbolicLink() || info.size !== entry.bytes) throw new Error('수신 파일 이름·유형·크기가 다릅니다.');
    if (sha256(await readFile(location)) !== entry.sha256) throw new Error(`수신 SHA-256이 다릅니다: ${entry.name}`);
  }
  if (!context.offline && !dependencies.install) throw new Error('로컬에서 준비한 오프라인 의존성이 필요합니다. 서버에서는 패키지를 다운로드하지 않습니다.');
  const server = await inspectMcpServer(config, { ...dependencies.preflight, ...(context.runtime ? { runtime: context.runtime } : {}), lockOwner: owner });
  const rollbackBaseline = { receipt: server.receipt, manifest: server.previousManifest, active: server.active, enabled: server.enabled };
  await writeFile(path.join(incoming, 'baseline.json'), JSON.stringify({ owner, root: config.remoteRoot, baseline: rollbackBaseline }), { flag: 'wx', mode: 0o600 });
  const appDirectory = path.join(config.remoteRoot, 'apps', `${metadata.releaseId}-${owner}`);
  await mkdir(path.dirname(appDirectory), { recursive: true, mode: 0o755 });
  const appTar = inspectMcpTar(await readFile(path.join(incoming, 'app.tar.gz')));
  if (appTar.comment !== metadata.head) throw new Error('수신 source tar commit이 다릅니다.');
  await extractMcpTar(appTar, appDirectory);
  await extractMcpTar(inspectMcpTar(await readFile(path.join(incoming, 'archive.tar.gz'))), path.join(incoming, 'archive'));
  await (dependencies.install ?? ((directory) => installMcpOfflineDependencies(directory, context)))(appDirectory, server.packageManager);
  const merged = await prepareMcpArchiveMerge({ ...context, appDirectory });
  const nextUnit = renderMcpUnit(config, server.node);
  const receipt = { schemaVersion: 1, releaseId: metadata.releaseId, head: metadata.head, root: config.remoteRoot, url: config.url, service: config.service, appDirectory, node: server.node, packageManager: server.packageManager, owner, unitSha256: hashContent(nextUnit) };
  const state = {
    owner, root: config.remoteRoot, rollbackBaseline, phase: 'prepared', appDirectory, ...merged,
    beforeCurrent: server.receipt ? await readlink(path.join(config.remoteRoot, 'current')) : undefined,
    previousUnit: server.receipt ? await readFile(server.unitPath, 'utf8') : undefined,
    previousReceipt: server.receipt ? await readFile(path.join(config.remoteRoot, 'deployment.json'), 'utf8') : undefined,
    nextUnit, nextReceipt: `${JSON.stringify(receipt, null, 2)}\n`, unitPath: server.unitPath, active: server.active, enabled: server.enabled,
  };
  await writeFile(path.join(incoming, 'transaction.json'), JSON.stringify(state), { flag: 'wx', mode: 0o600 });
  await assertMcpOwner(context);
  await atomicMcpFile(path.join(config.remoteRoot, 'archive/versions/index.json'), state.nextIndex, owner);
  await atomicMcpLink(context, appDirectory);
  await atomicMcpFile(server.unitPath, nextUnit, owner);
  const run = dependencies.run ?? (await import('./deploy-mcp-preflight.mjs')).capture;
  await run('systemctl', ['daemon-reload']);
  await assertMcpUnitConfiguration(config, run);
  await run('systemctl', ['enable', `${config.service}.service`]);
  const unit = `${config.service}.service`;
  try { await run('systemctl', [server.active === 'active' ? 'restart' : 'start', unit]); }
  catch (cause) { throw await serviceStartupError(run, unit, cause); }
  if (await run('systemctl', ['show', unit, '--property=ActiveState', '--value']) !== 'active') throw await serviceStartupError(run, unit);
  await atomicMcpFile(path.join(config.remoteRoot, 'deployment.json'), state.nextReceipt, owner);
  state.phase = 'activated';
  await saveMcpTransaction(context, state);
  return receipt;
}

export async function runMcpRemoteOperation(operation, plan, dependencies = {}) {
  const config = validateMcpConfig(plan.config);
  if (!/^[0-9a-f-]{36}$/.test(plan.owner) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(plan.metadata.releaseId) || !/^[0-9a-f]{40}$/.test(plan.metadata.head)) throw new Error('배포 계획 owner·releaseId·head가 올바르지 않습니다.');
  const context = { ...plan, config, incoming: path.join(config.remoteRoot, `.incoming-${plan.owner}`) };
  if (operation === 'commit') return commitMcpTransaction(context, dependencies);
  if (operation === 'rollback') return rollbackMcpTransaction(context, dependencies);
  if (operation === 'rollback-finalize') return finalizeMcpRollback(context);
  if (operation !== 'activate') throw new Error('지원하지 않는 원격 작업입니다.');
  try { return await activateMcpDeployment(context, dependencies); }
  catch (error) {
    try { await rollbackMcpTransaction(context, dependencies); }
    catch (rollbackError) { throw new Error(`${error.message} 자동 복구 실패: ${rollbackError.message} 복구 기록과 잠금을 보존했습니다: ${context.incoming}, ${config.remoteRoot}/.deploy.lock`, { cause: error }); }
    throw new Error(`${error.message} 이전 service 상태를 복구했습니다. 진단 기록: ${context.incoming}`, { cause: error });
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [, , operation, encoded] = process.argv;
  runMcpRemoteOperation(operation, JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')))
    .then((result) => console.log(`OWP_MCP_RESULT ${JSON.stringify(result)}`))
    .catch((error) => { console.error(`MCP 배포 중단: ${error.message}`); console.log(`OWP_MCP_ERROR ${JSON.stringify({ message: error.message })}`); process.exitCode = 1; });
}
