import { get } from 'node:http';
import { createConnection } from 'node:net';
import { createInterface } from 'node:readline/promises';

async function askVpn() {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const cancellation = new AbortController();
  terminal.once('close', () => cancellation.abort());
  terminal.once('SIGINT', () => cancellation.abort());

  try {
    return await terminal.question('Company VPN connected? [Y/n]: ', {
      signal: cancellation.signal,
    });
  } catch (cause) {
    throw new Error('VPN 연결 확인을 취소했습니다.', { cause });
  } finally {
    terminal.close();
  }
}

export async function confirmVpn({ interactive, assumeVpn = false, ask = askVpn }) {
  if (assumeVpn) return;
  if (!interactive) {
    throw new Error(
      '비대화형 실행에는 명시적인 VPN 확인이 필요합니다. 회사 VPN 연결 후 pnpm deploy -- --assume-vpn을 실행해 주세요.',
    );
  }

  const answer = (await ask()).trim().toLowerCase();
  if (!['', 'y', 'yes', '예', '네'].includes(answer)) {
    throw new Error('배포를 취소했습니다. 회사 VPN 연결 후 pnpm deploy를 다시 실행해 주세요.');
  }
}

export function checkSshPort({ host, sshPort, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port: sshPort });
    let settled = false;
    const finish = (cause) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (cause) {
        reject(new Error(
          `${host}:${sshPort}에 접근할 수 없습니다. 회사 VPN 연결과 서버 상태를 확인한 뒤 pnpm deploy를 다시 실행해 주세요.`,
          { cause },
        ));
      } else {
        resolve();
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish());
    socket.once('timeout', () => finish(new Error('TCP connection timed out')));
    socket.once('error', finish);
  });
}

export function checkHttpHealth({ url, timeoutMs }) {
  const healthUrl = `${url}/health`;
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const request = get(healthUrl, { agent: false, headers: { 'Cache-Control': 'no-cache' } });
    const finish = (cause) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      request.destroy();
      if (cause) {
        reject(new Error(`${healthUrl} 접근 검사에 실패했습니다: ${cause.message}`, { cause }));
      } else {
        resolve();
      }
    };
    timer = setTimeout(() => finish(new Error('HTTP 응답 시간 초과')), timeoutMs);
    request.once('error', finish);
    request.once('response', (response) => {
      if (response.statusCode !== 200) {
        finish(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 4096) {
          finish(new Error('/health 응답 크기가 4KB를 초과합니다.'));
          return;
        }
        chunks.push(chunk);
      });
      response.once('error', finish);
      response.once('end', () => {
        if (Buffer.concat(chunks).toString('utf8').trim() !== 'ok') {
          finish(new Error('/health 응답이 ok가 아닙니다.'));
          return;
        }
        finish();
      });
    });
  });
}

export function authenticationOptions(config, { interactive }) {
  return [
    '-o', 'StrictHostKeyChecking=yes',
    '-o', 'NumberOfPasswordPrompts=1',
    '-o', `ConnectTimeout=${Math.ceil(config.timeoutMs / 1000)}`,
    '-o', 'ConnectionAttempts=1',
    '-o', `BatchMode=${interactive ? 'no' : 'yes'}`,
  ];
}

export async function checkSshAuthentication(config, run, { interactive }) {
  const args = [
    '-p', String(config.sshPort), ...authenticationOptions(config, { interactive }),
    `${config.user}@${config.host}`, 'test "$(id -u)" -eq 0',
  ];
  try {
    await run('ssh', args);
  } catch (cause) {
    throw new Error(
      'SSH 인증에 실패했습니다. 터미널에서 ssh root@192.168.100.20 접속과 기존 호스트 키를 확인해 주세요. 비밀번호는 SSH 프롬프트에만 입력합니다.',
      { cause },
    );
  }
}
