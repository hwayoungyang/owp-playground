#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validateBuild } from './deploy-build.mjs';
import { assertBuildContext, createArtifact, readBuildContext } from './deploy-artifact.mjs';
import { checkHttpHealth, checkSshAuthentication, checkSshPort, confirmVpn } from './deploy-preflight.mjs';
import { transferArtifact } from './deploy-transfer.mjs';
import { stageRelease } from './deploy-staging.mjs';
import { activateRelease } from './deploy-activation.mjs';
import { checkServerReady } from './deploy-server.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const deploymentConfig = Object.freeze({
  host: '192.168.100.20',
  sshPort: 22,
  user: 'root',
  url: 'http://192.168.100.20:30010',
  timeoutMs: 5000,
  remoteRoot: '/home/owp-playground',
  container: 'owp-playground-nginx',
});

const help = `OWP Playground Deployment

사용법: pnpm deploy [-- 옵션]

새 빌드·artifact 전송·staging 검증 후 current를 원자적으로 전환합니다.
배포 후 실제 HTTP 파일을 검증하며 실패하면 이전 current로 자동 복구합니다.

옵션:
  -h, --help         도움말을 표시합니다. 네트워크 검사나 빌드는 실행하지 않습니다.
  --assume-vpn       VPN 연결을 명시적으로 확인합니다. 실제 접근 검사는 계속 수행합니다.
  --preflight-only   VPN·접근·SSH·서버 도구·컨테이너·mount를 확인합니다. 빌드는 실행하지 않습니다.

대화형 실행은 기존 SSH 비밀번호·키·Agent 인증을 사용합니다.
비대화형 실행은 --assume-vpn과 비대화형 SSH 인증이 필요합니다.
사전 검사만 실행: pnpm deploy:preflight
옵션 전달 예: pnpm deploy -- --assume-vpn
처음 접속하는 Mac에서는 ssh root@192.168.100.20으로 호스트 키 지문을 확인해 주세요.
`;

export function parseDeployOptions(args) {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h' },
      'assume-vpn': { type: 'boolean' },
      'preflight-only': { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  });
  return { help: values.help ?? false, assumeVpn: values['assume-vpn'] ?? false, preflightOnly: values['preflight-only'] ?? false };
}

export function runCommand(command, args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot, stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit', shell: false,
    });
    let stdout = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.once('error', (cause) => reject(new Error(`${command} 실행을 시작하지 못했습니다.`, { cause })));
    child.once('close', (code, signal) => {
      if (code === 0) resolve(capture ? stdout : undefined);
      else reject(new Error(`${command} 실행에 실패했습니다 (${signal ?? code ?? 'unknown'}).`));
    });
  });
}

export async function runDeployment(options, dependencies = {}) {
  const {
    config = deploymentConfig,
    interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
    confirm = confirmVpn,
    checkPort = checkSshPort,
    checkHealth = checkHttpHealth,
    authenticate = checkSshAuthentication,
    run = runCommand,
    validate = validateBuild,
    context = readBuildContext,
    pack = createArtifact,
    transfer = transferArtifact,
    stage = stageRelease,
    ready = checkServerReady,
    activate = activateRelease,
    log = console.log,
  } = dependencies;

  log('OWP Playground Deployment');
  log('새 빌드·전송·검증 후 current를 전환합니다.');
  await confirm({ interactive, assumeVpn: options.assumeVpn });
  await checkPort(config);
  log(`SSH 포트 접근: OK (${config.host}:${config.sshPort})`);
  await checkHealth(config);
  log('HTTP /health 접근: OK');
  await authenticate(config, run, { interactive });
  log('SSH 인증: OK');
  await ready(config, { interactive, run });
  log('서버 도구·Nginx 컨테이너·bind mount 사전 검사: OK');

  if (options.preflightOnly) {
    log('배포 사전 검사 완료');
    return { stage: 'preflight-checked' };
  }

  const before = await context(repoRoot);
  log('pnpm build 실행 중...');
  await run('pnpm', ['build']);
  const build = await validate(path.join(repoRoot, 'dist'));
  assertBuildContext(before, await context(repoRoot));
  log(`빌드 검증: OK (${build.files}개 파일, assets ${build.assets}개, ${(build.bytes / 1_000_000).toFixed(2)}MB)`);
  const artifact = await pack({ directory: path.join(repoRoot, 'dist'), context: before });
  try {
    assertBuildContext(before, await context(repoRoot));
    log(`Artifact: ${artifact.release} (${(artifact.bytes / 1_000_000).toFixed(2)}MB)`);
    log(`SHA-256: ${artifact.sha256}`);
    const uploaded = await transfer(config, artifact, { interactive, run, log });
    log('Artifact 전송·서버 SHA-256 검증: OK');
    log(`서버 임시 파일: ${uploaded.archive}`);
    const staged = await stage(config, artifact, uploaded, { interactive, run });
    log(`Release staging 검증: OK (${staged.files}개 파일)`);
    log(`서버 staging 경로: ${staged.directory}`);
    const activated = await activate(config, artifact, uploaded, staged, { interactive, run, verifyHealth: true });
    log(`OWP Playground Deployment Successful\nRelease: ${artifact.release}\nBuild: OK\nUpload: OK\nHealth: OK\nURL: ${config.url}`);
    return { stage: 'deployed', build, uploaded, staged, activated };
  } finally {
    await artifact.cleanup();
  }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseDeployOptions(args);
  if (options.help) {
    console.log(help);
    return;
  }
  await runDeployment(options);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`배포 중단: ${error.message}`);
    process.exitCode = 1;
  });
}
