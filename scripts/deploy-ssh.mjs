import { chmod, lstat, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { authenticationOptions } from './deploy-ssh-options.mjs';

const connectionError = (cause) => new Error('SSH 공유 연결이 종료됐습니다. 추가 비밀번호 입력 없이 중단합니다. VPN·서버 상태를 확인하고 명령을 다시 실행해 주세요.', { cause });

function sharedArguments(args, controlPath) {
  const filtered = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '-o' && /^(BatchMode|NumberOfPasswordPrompts)=/i.test(args[index + 1] ?? '')) { index++; continue; }
    filtered.push(args[index]);
  }
  return [
    '-o', `ControlPath=${controlPath}`, '-o', 'ControlMaster=no', '-o', 'ControlPersist=no',
    '-o', 'BatchMode=yes', '-o', 'NumberOfPasswordPrompts=0',
    '-o', 'PasswordAuthentication=no', '-o', 'KbdInteractiveAuthentication=no',
    '-o', 'ProxyCommand=false', ...filtered,
  ];
}

export async function openSshSession(config, { interactive, run, log = console.log, signals = process }) {
  const directory = await mkdtemp('/tmp/owp-ssh-');
  const controlPath = path.join(directory, 'socket');
  const destination = `${config.user}@${config.host}`;
  const abort = new AbortController();
  let closing;
  let interrupted = false;
  const control = (operation) => run('ssh', [
    '-p', String(config.sshPort), ...sharedArguments([], controlPath),
    '-O', operation, destination,
  ], { capture: true, quiet: true });
  const onInterrupt = () => interrupt('SIGINT');
  const onTerminate = () => interrupt('SIGTERM');

  function interrupt(signal) {
    if (interrupted) return;
    interrupted = true;
    abort.abort();
    void close().finally(() => signals.kill(signals.pid, signal));
  }

  async function close() {
    if (closing) return closing;
    signals.removeListener('SIGINT', onInterrupt);
    signals.removeListener('SIGTERM', onTerminate);
    abort.abort();
    closing = (async () => {
      try {
        await lstat(controlPath);
      } catch (cause) {
        if (cause.code !== 'ENOENT') { log(`SSH 임시 경로를 확인하지 못했습니다: ${directory}`); return; }
        await rm(directory, { recursive: true, force: true });
        return;
      }
      try { await control('exit'); }
      catch {
        log(`SSH 공유 연결 종료를 확인하지 못했습니다. 임시 경로를 보존합니다: ${directory} (유휴 연결은 최대 10분 후 종료됩니다.)`);
        return;
      }
      await rm(directory, { recursive: true, force: true });
    })().catch(() => log(`SSH 임시 경로를 정리하지 못했습니다: ${directory}`));
    return closing;
  }

  signals.once('SIGINT', onInterrupt);
  signals.once('SIGTERM', onTerminate);
  try {
    await chmod(directory, 0o700);
    await run('ssh', [
      '-p', String(config.sshPort), ...authenticationOptions(config, { interactive }),
      '-o', 'ControlMaster=yes', '-o', `ControlPath=${controlPath}`, '-o', 'ControlPersist=600',
      '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=2',
      '-o', 'ForwardAgent=no', '-o', 'ForwardX11=no', '-o', 'ClearAllForwardings=yes',
      destination, 'true',
    ], { signal: abort.signal });
    await control('check');
    if (closing || interrupted) throw connectionError();
  } catch (cause) {
    await close();
    throw new Error('최초 SSH 인증 또는 공유 연결 준비에 실패했습니다. 비밀번호는 터미널 SSH 프롬프트에만 입력해 주세요.', { cause });
  }

  return {
    async run(command, args, options = {}) {
      if (closing || interrupted) throw connectionError();
      if (command === 'ssh' || command === 'scp') {
        if (command === 'ssh' ? args.at(-2) !== destination : !args.at(-1)?.startsWith(`${destination}:`)) {
          throw new Error('공유 SSH 연결과 다른 서버로 향하는 명령을 거부했습니다.');
        }
        try { await control('check'); } catch (cause) { throw connectionError(cause); }
        return run(command, sharedArguments(args, controlPath), { ...options, signal: abort.signal });
      }
      return run(command, args, { ...options, signal: abort.signal });
    },
    close,
  };
}
