import { execFile } from 'node:child_process';
import { mkdir, readFile, readlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { validateMcpConfig } from './deploy-mcp-config.mjs';
import { inspectMcpServer, optionalStat, hashContent, assertMcpUnitConfiguration } from './deploy-mcp-preflight.mjs';
import { extractMcpTar, inspectMcpTar, sha256 } from './deploy-mcp-tar.mjs';
import { prepareMcpArchiveMerge } from './deploy-mcp-archive.mjs';
import { renderMcpUnit } from './deploy-mcp-unit.mjs';
import { assertMcpOwner, atomicMcpFile, atomicMcpLink, saveMcpTransaction, rollbackMcpTransaction, commitMcpTransaction, finalizeMcpRollback } from './deploy-mcp-transaction.mjs';

const execute = promisify(execFile);
export async function installMcpDependencies(appDirectory) {
  try {
    await execute('corepack', ['pnpm', 'install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--config.manage-package-manager-versions=false'], {
      cwd: appDirectory, env: { ...process.env, NODE_ENV: 'production', COREPACK_ENABLE_NETWORK: '0' }, timeout: 10 * 60 * 1000, maxBuffer: 4 * 1024 * 1024,
    });
  } catch (cause) { throw new Error('prod frozen dependency 설치에 실패했습니다. 준비된 pnpm·registry·lockfile을 확인해 주세요.', { cause }); }
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
  const server = await inspectMcpServer(config, { ...dependencies.preflight, lockOwner: owner });
  const rollbackBaseline = { receipt: server.receipt, manifest: server.previousManifest, active: server.active, enabled: server.enabled };
  await writeFile(path.join(incoming, 'baseline.json'), JSON.stringify({ owner, root: config.remoteRoot, baseline: rollbackBaseline }), { flag: 'wx', mode: 0o600 });
  const appDirectory = path.join(config.remoteRoot, 'apps', `${metadata.releaseId}-${owner}`);
  await mkdir(path.dirname(appDirectory), { recursive: true, mode: 0o755 });
  const appTar = inspectMcpTar(await readFile(path.join(incoming, 'app.tar.gz')));
  if (appTar.comment !== metadata.head) throw new Error('수신 source tar commit이 다릅니다.');
  await extractMcpTar(appTar, appDirectory);
  await extractMcpTar(inspectMcpTar(await readFile(path.join(incoming, 'archive.tar.gz'))), path.join(incoming, 'archive'));
  await (dependencies.install ?? installMcpDependencies)(appDirectory);
  const merged = await prepareMcpArchiveMerge({ ...context, appDirectory });
  const nextUnit = renderMcpUnit(config, server.node);
  const receipt = { schemaVersion: 1, releaseId: metadata.releaseId, head: metadata.head, root: config.remoteRoot, url: config.url, service: config.service, appDirectory, node: server.node, owner, unitSha256: hashContent(nextUnit) };
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
  await run('systemctl', [server.active === 'active' ? 'restart' : 'start', `${config.service}.service`]);
  if (await run('systemctl', ['show', `${config.service}.service`, '--property=ActiveState', '--value']) !== 'active') throw new Error('새 MCP service가 active 상태가 아닙니다.');
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
    .catch((error) => { console.error(`MCP 배포 중단: ${error.message}`); process.exitCode = 1; });
}
