#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { confirmVpn, checkSshPort } from './deploy-preflight.mjs';
import { runCommand } from './deploy-playground.mjs';
import { openSshSession } from './deploy-ssh.mjs';
import { mcpDeploymentConfig, parseMcpDeployOptions, validateMcpConfig } from './deploy-mcp-config.mjs';
import { prepareMcpBundle } from './deploy-mcp-bundle.mjs';
import { prepareMcpOffline } from './deploy-mcp-offline.mjs';
import { probeMcpRemote, bootstrapMcpRemote } from './deploy-mcp-bootstrap.mjs';
import { knowledgeReleaseSchema } from '../src/features/releases/model/schema.ts';
import { verifyMcpDeployment } from './deploy-mcp-verify.mjs';
import { pinMcpHelpers, preflightMcpRemote, transferMcpBundle, operateMcpRemote, discardMcpIncoming } from './deploy-mcp-transport.mjs';

export { mcpDeploymentConfig, parseMcpDeployOptions };
export const help = `OWP versioned Playground + MCP 배포 (port 30011)

사용법: pnpm deploy:mcp [--bundle DIR] [옵션]
준비된 app.tar.gz·archive.tar.gz·SHA256SUMS·release.json을 검증하고 Linux x64용 런타임·앱 의존성을 로컬에서 준비하여 배포합니다.
기본으로 저장소 .omo/evidence/versioned-mcp 바로 아래 deploy-bundle-* 중 최신 clean stable 묶음을 선택합니다.
최신 기준은 releaseId의 YYYYMMDD-HHMMSS이며, 새 빌드나 묶음을 만들지 않습니다.

  --bundle DIR       자동 선택 대신 배포할 묶음을 직접 지정합니다.
  --dry-run          로컬 묶음·helper SHA-256과 준비 계획만 검사합니다. 다운로드·SSH를 사용하지 않습니다.
  --preflight-only   로컬 오프라인 자료를 준비하고 읽기 전용 서버 검사만 수행합니다. 서버 업로드·설치·서비스 변경은 없습니다.
  --assume-vpn       회사 VPN 연결을 명시적으로 확인합니다.
  -h, --help         네트워크나 파일 변경 없이 도움말을 표시합니다.

로컬에서 Node 24.22.1·pnpm 12.15.0의 Linux x64 파일과 고정된 앱 의존성을 준비합니다. 로컬의 다운로드·registry 접근이 필요합니다.
서버는 Linux x64 glibc 환경과 systemd·ss·기본 shell 명령이 필요하며, 외부 접속·전역 Node·pnpm·Corepack은 필요하지 않습니다.
런타임은 배포 전용 경로에 설치합니다. OS 패키지·전역 실행 파일·방화벽은 변경하지 않습니다.
최초 SSH 인증 후 StrictHostKeyChecking=yes를 유지하는 공유 연결을 재사용합니다.
OWP_MCP_BEARER_TOKEN은 로컬 검증용 환경 변수입니다. 서버 mcp.env는 직접 준비해 주세요.
비대화형 실행에는 --assume-vpn이 필요합니다. 기존 port 30010 배포와 별도로 관리합니다.
`;

async function confirmMcpVpn(options) {
  if (!options.interactive && !options.assumeVpn) throw new Error('비대화형 deploy:mcp 실행에는 명시적인 VPN 확인이 필요합니다. 회사 VPN 연결 후 --assume-vpn을 지정해 주세요.');
  try { await confirmVpn(options); }
  catch (cause) { throw new Error('deploy:mcp의 VPN 확인을 취소했습니다. 회사 VPN 연결 후 다시 실행해 주세요.', { cause }); }
}

export async function runMcpDeployment(options, dependencies = {}) {
  if (options.help) { (dependencies.log ?? console.log)(help); return { stage: 'help' }; }
  const config = validateMcpConfig(dependencies.config);
  const interactive = dependencies.interactive ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const log = dependencies.log ?? console.log;
  const signals = dependencies.signals ?? process;
  const bundle = await (dependencies.prepare ?? prepareMcpBundle)(options.bundle, { bundleRoot: dependencies.bundleRoot });
  let session;
  let incoming = false;
  let transferred = false;
  let activationStarted = false;
  let server;
  let cancelled = false;
  let plan;
  const interrupt = () => { cancelled = true; log('deploy:mcp 취소를 요청했습니다. 진행 중인 단계가 끝나면 소유한 배포를 복구하고 SSH 연결을 정리합니다.'); };
  const assertRunning = () => { if (cancelled) throw new Error('deploy:mcp 실행을 취소했습니다.'); };
  const operate = dependencies.operate ?? operateMcpRemote;
  const verify = dependencies.verify ?? verifyMcpDeployment;
  try {
    const helpers = await (dependencies.pinHelpers ?? pinMcpHelpers)(bundle);
    plan = { config, bundle: bundle.source ?? (options.bundle === undefined ? undefined : path.resolve(options.bundle)), owner: (dependencies.owner ?? randomUUID)(), metadata: bundle.metadata, releaseId: bundle.metadata.releaseId, head: bundle.metadata.head, files: [...bundle.transferFiles, ...helpers] };
    log(`선택한 배포 묶음: ${plan.bundle} (${plan.releaseId})`);
    log(`묶음 검증: OK (${plan.releaseId}, ${plan.head})`);
    if (options.dryRun) {
      log(JSON.stringify({ stage: 'dry-run', bundle: plan.bundle, root: config.remoteRoot, url: config.url, releaseId: plan.releaseId, head: plan.head, files: plan.files, offline: { stage: 'pending-preparation', target: 'linux-x64-glibc', nodeVersion: '24.22.1', pnpmVersion: '12.15.0' } }, null, 2));
      return { stage: 'dry-run', plan };
    }
    await (dependencies.confirm ?? confirmMcpVpn)({ interactive, assumeVpn: options.assumeVpn });
    signals.on('SIGINT', interrupt);
    signals.on('SIGTERM', interrupt);
    assertRunning();
    const offline = await (dependencies.prepareOffline ?? prepareMcpOffline)(bundle, { log });
    plan.offline = offline.manifest;
    plan.files.push(...offline.transferFiles);
    log(`오프라인 배포 자료 준비: OK (${offline.manifest.target}, Node ${offline.manifest.nodeVersion}, pnpm ${offline.manifest.pnpmVersion})`);
    assertRunning();
    await (dependencies.checkPort ?? checkSshPort)(config);
    assertRunning();
    // 취소 시 rollback이 끝나기 전에 공유 SSH 연결이 닫히지 않도록 세션 신호를 분리합니다.
    session = await (dependencies.connect ?? openSshSession)(config, { interactive, run: dependencies.run ?? runCommand, log, signals: new EventEmitter() });
    const execution = { interactive, run: session.run };
    assertRunning();
    const probe = await (dependencies.probe ?? probeMcpRemote)(plan, execution);
    assertRunning();
    if (options.preflightOnly && probe.runtimePending) {
      log('기본 서버 검사: OK. 배포 전용 런타임 설치가 필요합니다. 서버 전송·설치는 하지 않았으며 Node·앱·서비스 상세 검사는 최초 배포에서 이어집니다.');
      return { stage: 'preflight-bootstrap-required', plan, server: probe };
    }
    if (options.preflightOnly) plan.runtime = probe.runtime;
    else {
      await (dependencies.bootstrap ?? bootstrapMcpRemote)(plan, bundle, execution);
      incoming = true;
      assertRunning();
      log('배포 전용 Node·pnpm 준비: OK');
    }
    server = await (dependencies.preflight ?? preflightMcpRemote)(config, execution, { runtime: plan.runtime, ...(incoming ? { lockOwner: plan.owner } : {}) });
    assertRunning();
    if (server.previousManifest) knowledgeReleaseSchema.parse(server.previousManifest);
    log('서버 Node·pnpm·systemd·port·관리 service 사전 검사: OK');
    if (options.preflightOnly) return { stage: 'preflight-checked', plan, server };
    await (dependencies.transfer ?? transferMcpBundle)(plan, bundle, execution);
    transferred = true;
    assertRunning();
    activationStarted = true;
    await operate('activate', plan, execution);
    assertRunning();
    const verification = await verify(config, bundle);
    assertRunning();
    const receipt = await operate('commit', plan, execution);
    if (receipt.releaseId !== plan.releaseId || receipt.head !== plan.head || receipt.root !== config.remoteRoot || receipt.url !== config.url || receipt.owner !== plan.owner) throw new Error('성공 receipt의 release·head·root·url·owner가 배포 계획과 다릅니다.');
    incoming = false;
    log(`MCP 배포 완료: ${plan.releaseId}\nHEAD: ${plan.head}\nRoot: ${config.remoteRoot}\nURL: ${config.url}`);
    return { stage: 'deployed', releaseId: plan.releaseId, head: plan.head, root: config.remoteRoot, url: config.url, receipt, verification };
  } catch (error) {
    if (incoming && session) {
      const execution = { interactive, run: session.run };
      try {
        if (activationStarted && transferred) {
          const restored = await operate('rollback', plan, execution);
          const baseline = restored.baseline;
          if (restored.changed && !baseline) throw new Error('transaction의 실제 복구 baseline을 확인하지 못했습니다.');
          if (baseline?.receipt && baseline.active === 'active') {
            const manifest = knowledgeReleaseSchema.parse(baseline.manifest);
            await verify(config, { manifest });
          }
          await operate('rollback-finalize', plan, execution);
          log('이전 service 상태 복구와 검증을 완료했습니다.');
        } else await (dependencies.discard ?? discardMcpIncoming)(plan, execution);
      } catch (rollbackError) {
        throw new Error(`${error.message} 복구 또는 연결 확인에 실패했습니다: ${rollbackError.message} 성공으로 처리하지 않았습니다. 복구 기록과 잠금을 확인해 주세요: ${config.remoteRoot}/.incoming-${plan.owner}, ${config.remoteRoot}/.deploy.lock`, { cause: error });
      }
    }
    throw error;
  } finally {
    signals.removeListener('SIGINT', interrupt);
    signals.removeListener('SIGTERM', interrupt);
    if (session) await session.close();
    await bundle.cleanup();
  }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseMcpDeployOptions(args);
  return runMcpDeployment(options);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main().catch((error) => {
  const token = process.env.OWP_MCP_BEARER_TOKEN;
  const message = token ? error.message.replaceAll(token, '[redacted]') : error.message;
  console.error(`MCP 배포 중단: ${message}`);
  process.exitCode = 1;
});
