import { readFile, readlink, readdir, rename, rm, rmdir, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { capture, hashContent, optionalStat, assertMcpUnitConfiguration, assertMcpDropInDirectories } from './deploy-mcp-preflight.mjs';

export const transactionPath = (context) => path.join(context.incoming, 'transaction.json');
export async function assertMcpOwner(context) {
  const { config, owner, incoming } = context;
  for (const directory of [path.join(config.remoteRoot, '.deploy.lock'), incoming]) {
    const info = await optionalStat(directory);
    const marker = await optionalStat(path.join(directory, 'owner'));
    if (!info?.isDirectory() || info.isSymbolicLink() || !marker?.isFile() || marker.isSymbolicLink() || await readFile(path.join(directory, 'owner'), 'utf8') !== owner) throw new Error(`배포 잠금 소유자가 다릅니다. 잠금과 자료를 보존합니다: ${directory}`);
  }
}
export async function atomicMcpFile(file, content, owner) {
  const temporary = `${file}.${owner}.tmp`;
  await writeFile(temporary, content, { flag: 'wx', mode: 0o600 });
  await rename(temporary, file);
}
export async function atomicMcpLink(context, target) {
  const temporary = path.join(context.config.remoteRoot, `.current-${context.owner}`);
  await symlink(target, temporary);
  await rename(temporary, path.join(context.config.remoteRoot, 'current'));
}
export async function saveMcpTransaction(context, state) {
  await atomicMcpFile(transactionPath(context), JSON.stringify(state), context.owner);
}
export async function releaseMcpLock(context) {
  await assertMcpOwner(context);
  const entries = await readdir(path.join(context.config.remoteRoot, '.deploy.lock'));
  if (entries.length !== 1 || entries[0] !== 'owner') throw new Error('잠금에 알 수 없는 항목이 있어 owner와 잠금을 보존합니다.');
  await rm(path.join(context.config.remoteRoot, '.deploy.lock/owner'));
  await rmdir(path.join(context.config.remoteRoot, '.deploy.lock'));
}
async function optionalContent(file) {
  const info = await optionalStat(file);
  if (!info) return undefined;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`복원 대상이 일반 파일이 아닙니다: ${file}`);
  return readFile(file, 'utf8');
}
export async function assertMcpTransactionState(context, state) {
  await assertMcpOwner(context);
  if (state.owner !== context.owner || state.root !== context.config.remoteRoot) throw new Error('transaction 소유 정보가 다릅니다.');
  const root = context.config.remoteRoot;
  const current = await optionalStat(path.join(root, 'current'));
  const link = current?.isSymbolicLink() ? await readlink(path.join(root, 'current')) : undefined;
  if ((current && !current.isSymbolicLink()) || ![state.beforeCurrent, state.appDirectory].includes(link)) throw new Error('current가 다른 작업에 의해 변경됐습니다. 복구를 중단합니다.');
  for (const [file, before, after] of [
    [path.join(root, 'archive/versions/index.json'), state.previousIndex, state.nextIndex],
    [state.unitPath, state.previousUnit, state.nextUnit],
    [path.join(root, 'deployment.json'), state.previousReceipt, state.nextReceipt],
  ]) if (![before, after].includes(await optionalContent(file))) throw new Error(`다른 작업이 변경한 파일을 복원하지 않습니다: ${file}`);
}

async function rollbackBaseline(context) {
  const file = path.join(context.incoming, 'baseline.json');
  const info = await optionalStat(file);
  if (!info) return undefined;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('복구 baseline 기록이 올바르지 않습니다.');
  const record = JSON.parse(await readFile(file, 'utf8'));
  if (record.owner !== context.owner || record.root !== context.config.remoteRoot) throw new Error('복구 baseline 소유자가 다릅니다.');
  return record.baseline;
}

export async function rollbackMcpTransaction(context, dependencies = {}) {
  const run = dependencies.run ?? capture;
  const file = transactionPath(context);
  const info = await optionalStat(file);
  if (!info) {
    await assertMcpOwner(context);
    return { rolledBack: true, changed: false, baseline: await rollbackBaseline(context) };
  }
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('transaction 기록이 일반 파일이 아닙니다.');
  const state = JSON.parse(await readFile(file, 'utf8'));
  if (state.phase === 'rolled-back') { await assertMcpOwner(context); return { rolledBack: true, changed: true, baseline: state.rollbackBaseline }; }
  if (state.phase === 'committed') throw new Error('이미 commit된 배포는 자동 복구하지 않습니다.');
  await assertMcpTransactionState(context, state);
  const unit = `${context.config.service}.service`;
  const loadState = await run('systemctl', ['show', unit, '--property=LoadState', '--value']);
  await assertMcpDropInDirectories(context.config, run);
  if (loadState === 'loaded') {
    await assertMcpUnitConfiguration(context.config, run);
    const currentActive = await run('systemctl', ['show', unit, '--property=ActiveState', '--value']);
    if (!['inactive', 'failed'].includes(currentActive)) await run('systemctl', ['stop', unit]);
  }
  if (await optionalStat(state.unitPath)) await run('systemctl', ['disable', unit]);
  const root = context.config.remoteRoot;
  if (state.beforeCurrent) await atomicMcpLink(context, state.beforeCurrent);
  else if (await optionalStat(path.join(root, 'current'))) await rm(path.join(root, 'current'));
  for (const [destination, content] of [
    [path.join(root, 'archive/versions/index.json'), state.previousIndex],
    [state.unitPath, state.previousUnit],
    [path.join(root, 'deployment.json'), state.previousReceipt],
  ]) {
    if (content !== undefined) await atomicMcpFile(destination, content, context.owner);
    else if (await optionalStat(destination)) await rm(destination);
  }
  await run('systemctl', ['daemon-reload']);
  if (state.previousUnit) await assertMcpUnitConfiguration(context.config, run);
  if (state.previousUnit && state.enabled === 'enabled') await run('systemctl', ['enable', unit]);
  if (state.previousUnit && state.active === 'active') await run('systemctl', ['start', unit]);
  const active = await run('systemctl', ['show', unit, '--property=ActiveState', '--value']);
  if (state.active === 'active' ? active !== 'active' : !['inactive', 'failed'].includes(active)) throw new Error('복구 후 service active 상태가 다릅니다. 잠금을 보존합니다.');
  if (state.previousUnit) {
    const enabled = await run('systemctl', ['show', unit, '--property=UnitFileState', '--value']);
    if (enabled !== state.enabled) throw new Error('복구 후 service enabled 상태가 다릅니다. 잠금을 보존합니다.');
  }
  state.phase = 'rolled-back';
  await saveMcpTransaction(context, state);
  return { rolledBack: true, changed: true, baseline: state.rollbackBaseline };
}

export async function commitMcpTransaction(context, dependencies = {}) {
  const run = dependencies.run ?? capture;
  const state = JSON.parse(await readFile(transactionPath(context), 'utf8'));
  if (state.phase !== 'activated') throw new Error('검증 가능한 activated 배포 상태가 아닙니다.');
  await assertMcpTransactionState(context, state);
  const root = context.config.remoteRoot;
  if (await readlink(path.join(root, 'current')) !== state.appDirectory || await readFile(path.join(root, 'archive/versions/index.json'), 'utf8') !== state.nextIndex || await readFile(state.unitPath, 'utf8') !== state.nextUnit || await readFile(path.join(root, 'deployment.json'), 'utf8') !== state.nextReceipt) throw new Error('commit 전에 배포 상태가 변경됐습니다.');
  const receipt = JSON.parse(state.nextReceipt);
  if (receipt.releaseId !== context.metadata.releaseId || receipt.head !== context.metadata.head || receipt.root !== root || receipt.url !== context.config.url || receipt.owner !== context.owner || receipt.unitSha256 !== hashContent(state.nextUnit)) throw new Error('성공 receipt와 배포 계획이 다릅니다.');
  const unit = `${context.config.service}.service`;
  if (await run('systemctl', ['show', unit, '--property=ActiveState', '--value']) !== 'active' || await run('systemctl', ['show', unit, '--property=UnitFileState', '--value']) !== 'enabled') throw new Error('commit 전 service active/enabled 검증에 실패했습니다.');
  await assertMcpUnitConfiguration(context.config, run);
  state.phase = 'committed';
  await saveMcpTransaction(context, state);
  await releaseMcpLock(context);
  await rm(context.incoming, { recursive: true });
  return receipt;
}

export async function finalizeMcpRollback(context) {
  await assertMcpOwner(context);
  const info = await optionalStat(transactionPath(context));
  if (info) {
    const state = JSON.parse(await readFile(transactionPath(context), 'utf8'));
    if (state.phase !== 'rolled-back') throw new Error('복구가 완료되지 않아 잠금을 보존합니다.');
    await assertMcpTransactionState(context, state);
    const current = await optionalStat(path.join(context.config.remoteRoot, 'current'));
    if ((current ? await readlink(path.join(context.config.remoteRoot, 'current')) : undefined) !== state.beforeCurrent) throw new Error('복구된 current가 변경됐습니다.');
    for (const [file, before] of [[state.unitPath, state.previousUnit], [path.join(context.config.remoteRoot, 'archive/versions/index.json'), state.previousIndex], [path.join(context.config.remoteRoot, 'deployment.json'), state.previousReceipt]]) if (await optionalContent(file) !== before) throw new Error('복구된 파일이 변경됐습니다.');
  }
  await releaseMcpLock(context);
  return { rolledBack: true, finalized: true };
}
