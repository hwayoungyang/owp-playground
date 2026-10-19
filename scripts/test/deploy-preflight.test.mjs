import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import test from 'node:test';
import { checkHttpHealth, checkSshAuthentication, checkSshPort, confirmVpn } from '../deploy-preflight.mjs';

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server.address().port;
}

async function close(server) {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}

for (const answer of ['', 'Y', 'yes', '네', '예']) {
  test(`accepts interactive VPN confirmation: ${JSON.stringify(answer)}`, async () => {
    await confirmVpn({ interactive: true, ask: async () => answer });
  });
}

test('VPN denial or an invalid answer stops the deployment', async () => {
  for (const answer of ['n', 'no', 'unknown']) {
    await assert.rejects(confirmVpn({ interactive: true, ask: async () => answer }), /배포를 취소했습니다/);
  }
});

test('noninteractive confirmation requires the explicit VPN option', async () => {
  const ask = () => { throw new Error('must not prompt'); };
  await assert.rejects(confirmVpn({ interactive: false, ask }), /--assume-vpn/);
  await confirmVpn({ interactive: false, assumeVpn: true, ask });
});

test('TCP probe connects to a listening server and rejects a refused connection', async () => {
  const server = createTcpServer((socket) => socket.end());
  const port = await listen(server);
  try {
    await checkSshPort({ host: '127.0.0.1', sshPort: port, timeoutMs: 1000 });
  } finally {
    await close(server);
  }
  await assert.rejects(checkSshPort({ host: '127.0.0.1', sshPort: port, timeoutMs: 1000 }), /회사 VPN/);
});

for (const [name, status, body, accepted] of [
  ['healthy', 200, 'ok\n', true],
  ['HTTP error', 503, 'ok', false],
  ['SPA fallback instead of health', 200, '<html>app</html>', false],
  ['redirect', 302, 'ok', false],
  ['oversized body', 200, 'x'.repeat(4097), false],
]) {
  test(`HTTP health probe checks ${name}`, async () => {
    const server = createHttpServer((request, response) => {
      assert.equal(request.url, '/health');
      response.writeHead(status, { Location: 'http://invalid.example/' });
      response.end(body);
    });
    const port = await listen(server);
    try {
      const result = checkHttpHealth({ url: `http://127.0.0.1:${port}`, timeoutMs: 1000 });
      if (accepted) await result;
      else await assert.rejects(result, /접근 검사에 실패했습니다/);
    } finally {
      await close(server);
    }
  });
}

test('HTTP probe has a total deadline for a server that never responds', async () => {
  const server = createHttpServer(() => {});
  const port = await listen(server);
  try {
    await assert.rejects(checkHttpHealth({ url: `http://127.0.0.1:${port}`, timeoutMs: 50 }), /응답 시간 초과/);
  } finally {
    await close(server);
  }
});

test('SSH uses native terminal authentication and strict known-host verification', async () => {
  const calls = [];
  const config = { user: 'root', host: '192.168.100.20', sshPort: 22, timeoutMs: 5000 };
  const run = async (...args) => { calls.push(args); };
  await checkSshAuthentication(config, run, { interactive: true });
  assert.equal(calls[0][0], 'ssh');
  assert.ok(calls[0][1].includes('StrictHostKeyChecking=yes'));
  assert.ok(calls[0][1].includes('BatchMode=no'));
  assert.ok(calls[0][1].includes('NumberOfPasswordPrompts=1'));
  assert.ok(calls[0][1].includes('root@192.168.100.20'));
  assert.equal(calls[0][1].at(-1), 'test "$(id -u)" -eq 0');
  assert.ok(!calls[0][1].some((argument) => /IdentityFile|UserKnownHostsFile|sshpass/.test(argument)));
  await checkSshAuthentication(config, run, { interactive: false });
  assert.ok(calls[1][1].includes('BatchMode=yes'));
});

test('SSH failure reports the native authentication path', async () => {
  await assert.rejects(checkSshAuthentication({ user: 'root', host: '192.168.100.20', sshPort: 22, timeoutMs: 5000 }, async () => { throw new Error('exit 255'); }, { interactive: true }), /SSH 인증에 실패했습니다/);
});
