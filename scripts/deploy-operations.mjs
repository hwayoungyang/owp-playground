#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { deploymentConfig, runCommand } from './deploy-playground.mjs';
import { checkHttpHealth, checkSshAuthentication, checkSshPort, confirmVpn } from './deploy-preflight.mjs';
import { checkServedRelease, readReleaseStatus } from './deploy-status.mjs';
import { rollbackRelease } from './deploy-rollback.mjs';
import { cleanupReleases } from './deploy-cleanup.mjs';
import { openSshSession } from './deploy-ssh.mjs';

export async function confirmOperation(question) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const cancellation = new AbortController();
  terminal.once('close', () => cancellation.abort());
  terminal.once('SIGINT', () => cancellation.abort());
  try {
    return ['y', 'yes', '예', '네'].includes((await terminal.question(`${question} [y/N]: `, { signal: cancellation.signal })).trim().toLowerCase());
  } catch (cause) { throw new Error('작업 확인을 취소했습니다.', { cause }); }
  finally { terminal.close(); }
}

export function parseOperationOptions(args) {
  const action = args[0];
  if (!['status', 'rollback', 'cleanup'].includes(action)) throw new Error('status, rollback 또는 cleanup 명령을 지정해 주세요.');
  const { values } = parseArgs({ args: args.slice(1), strict: true, allowPositionals: false, options: {
    help: { type: 'boolean', short: 'h' }, 'assume-vpn': { type: 'boolean' },
    ...(action !== 'status' ? { yes: { type: 'boolean', short: 'y' } } : {}),
    ...(action === 'cleanup' ? { 'dry-run': { type: 'boolean' } } : {}),
  } });
  return { action, help: values.help ?? false, assumeVpn: values['assume-vpn'] ?? false, yes: values.yes ?? false, dryRun: values['dry-run'] ?? false };
}

export async function runOperation(options, dependencies = {}) {
  const { config = deploymentConfig, interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY), run: execute = runCommand, connect = openSshSession,
    confirm = confirmVpn, checkPort = checkSshPort, authenticate = checkSshAuthentication, checkHealth = checkHttpHealth,
    inspect = readReleaseStatus, served = checkServedRelease, rollback = rollbackRelease, cleanup = cleanupReleases, ask = confirmOperation, log = console.log } = dependencies;
  await confirm({ interactive, assumeVpn: options.assumeVpn });
  await checkPort(config);
  const session = await connect(config, { interactive, run: execute, log });
  const run = session.run;
  try {
    await authenticate(config, run, { interactive });
    const status = await inspect(config, { interactive, run, includeMetadata: options.action === 'status' });
    if (options.action === 'cleanup') {
      if (status.locked) throw new Error('배포 잠금이 있어 릴리스 정리를 중단합니다.');
      const plan = await cleanup(config, { interactive, run, dryRun: true });
      log(`정리 후보: ${plan.candidates.join(', ') || '(없음)'}`);
      if (options.dryRun || plan.candidates.length === 0) return plan;
      if (!options.yes && (!interactive || !await ask('보호 대상을 제외한 이전 릴리스를 정리할까요?'))) throw new Error('릴리스 정리를 취소했습니다. 비대화형 실행에는 --yes가 필요합니다.');
      const result = await cleanup(config, { interactive, run, dryRun: false, approved: plan.candidates });
      log(`릴리스 정리 완료: ${result.removed.length}개`);
      return result;
    }
    if (options.action === 'status') {
      let healthy = true;
      try { await checkHealth(config); await served(config, status); } catch { healthy = false; }
      healthy = healthy && status.running;
      log(`OWP Playground Deployment Status\nServer: ${config.host}\nURL: ${config.url}\nContainer: ${config.container}\nContainer Status: ${status.running ? 'Running' : 'Not running'}\nCurrent Release: ${status.current}\nPrevious Release: ${status.previous ?? '(없음)'}\nDeployment Lock: ${status.locked ? '있음' : '없음'}\nHealth: ${healthy ? 'OK (HTTP 200)' : 'FAIL'}`);
      log('Installed Packages:');
      for (const [name, version] of Object.entries(status.metadata?.packages ?? {})) log(`${name.padEnd(24)} ${version}`);
      return { ...status, healthy: healthy && status.running };
    }
    if (!status.previous || status.locked) throw new Error('이전 정상 릴리스가 없거나 배포 잠금이 있어 rollback을 중단합니다.');
    log(`Rollback: ${status.current} → ${status.previous}`);
    if (!options.yes && (!interactive || !await ask('위 릴리스로 rollback할까요?'))) throw new Error('rollback을 취소했습니다. 비대화형 실행에는 --yes가 필요합니다.');
    const result = await rollback(config, status, { interactive, run });
    log(`OWP Playground Rollback Successful\nCurrent Release: ${result.current}\nPrevious Release: ${result.previous}\nHealth: OK\nURL: ${config.url}`);
    return result;
  } finally {
    await session.close();
  }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOperationOptions(args);
  if (options.help) {
    console.log(`사용법: pnpm deploy:${options.action} [--assume-vpn]${options.action !== 'status' ? ' [--yes]' : ''}${options.action === 'cleanup' ? ' [--dry-run]' : ''}\nstatus는 읽기 전용입니다. rollback은 current 전환과 HTTP 검증을 수행합니다. cleanup은 최근 정상 릴리스 5개와 보호 대상을 유지합니다.`);
    return;
  }
  const result = await runOperation(options);
  if (options.action === 'status' && !result.healthy) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`작업 중단: ${error.message}`); process.exitCode = 1; });
}
