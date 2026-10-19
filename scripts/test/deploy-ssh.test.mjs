import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { EventEmitter, once } from 'node:events';
import { access, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { openSshSession } from '../deploy-ssh.mjs';
import { authenticationOptions } from '../deploy-preflight.mjs';

const execute = promisify(execFile);
const config = { user: 'root', host: '127.0.0.1', sshPort: 22, timeoutMs: 1000 };
const destination = `${config.user}@${config.host}`;
const sshArgs = ['-p', '22', ...authenticationOptions(config, { interactive: true }), destination, 'id -u'];

function option(args, name) {
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
}

function fixture(t, controls = {}) {
  const calls = [];
  const directories = new Set();
  const sessions = [];
  const logs = [];
  const signals = new EventEmitter();
  const killed = [];
  signals.pid = 1234;
  signals.kill = (pid, signal) => killed.push({ pid, signal });
  const run = async (command, args, options = {}) => {
    calls.push({ command, args, options });
    const socket = option(args, 'ControlPath');
    if (option(args, 'ControlMaster') === 'yes') {
      directories.add(path.dirname(socket));
      if (controls.authFailure) throw new Error('native authentication failed');
      await writeFile(socket, '', { mode: 0o600 });
      return;
    }
    const operation = args[args.indexOf('-O') + 1];
    if (args.includes('-O')) {
      if (operation === 'check' && controls.disconnected) throw new Error('master is gone');
      if (operation === 'exit' && controls.exitFailure) throw new Error('exit failed');
      return;
    }
    if (controls.commandFailure) throw controls.commandFailure;
    return 'command output';
  };
  t.after(async () => {
    for (const session of sessions) await session.close();
    for (const directory of directories) await rm(directory, { recursive: true, force: true });
  });
  return {
    calls, directories, logs, signals, killed,
    async open(interactive = true) {
      const session = await openSshSession(config, { interactive, run, signals, log: (message) => logs.push(message) });
      sessions.push(session);
      return session;
    },
  };
}

test('authenticates once and shares the private connection across SSH, SCP and local build', async (t) => {
  const state = fixture(t);
  const session = await state.open();
  const master = state.calls[0];
  const socket = option(master.args, 'ControlPath');
  assert.equal(master.command, 'ssh');
  assert.equal(option(master.args, 'BatchMode'), 'no');
  assert.equal(option(master.args, 'NumberOfPasswordPrompts'), '1');
  assert.equal(option(master.args, 'StrictHostKeyChecking'), 'yes');
  assert.equal(option(master.args, 'ControlPersist'), '600');
  assert.deepEqual(master.args.slice(-2), [destination, 'true']);
  assert.equal((await stat(path.dirname(socket))).mode & 0o777, 0o700);
  assert.deepEqual(await readdir(path.dirname(socket)), ['socket']);
  assert.equal(await session.run('ssh', sshArgs, { capture: true }), 'command output');
  await session.run('scp', ['-P', '22', ...authenticationOptions(config, { interactive: true }), '--', '/tmp/artifact.tar.gz', `${destination}:/home/artifact.tar.gz`]);
  await session.run('pnpm', ['build']);
  const shared = state.calls.filter((call) => call.args.includes('id -u') || call.command === 'scp');
  assert.equal(shared.length, 2);
  for (const call of shared) {
    assert.equal(option(call.args, 'ControlPath'), socket);
    assert.equal(option(call.args, 'ControlMaster'), 'no');
    assert.equal(option(call.args, 'BatchMode'), 'yes');
    assert.equal(option(call.args, 'NumberOfPasswordPrompts'), '0');
    assert.equal(option(call.args, 'PasswordAuthentication'), 'no');
    assert.equal(option(call.args, 'KbdInteractiveAuthentication'), 'no');
    assert.equal(option(call.args, 'ProxyCommand'), 'false');
    assert.equal(option(call.args, 'StrictHostKeyChecking'), 'yes');
    assert.ok(!call.args.includes('BatchMode=no'));
    assert.ok(!call.args.includes('NumberOfPasswordPrompts=1'));
    assert.equal(call.options.signal, master.options.signal);
  }
  assert.deepEqual(state.calls.find((call) => call.command === 'pnpm').args, ['build']);
  assert.equal(state.calls.filter((call) => option(call.args, 'ControlMaster') === 'yes').length, 1);
  await Promise.all([session.close(), session.close()]);
  assert.equal(state.calls.filter((call) => call.args.includes('exit')).length, 1);
  await assert.rejects(access(path.dirname(socket)), { code: 'ENOENT' });
  assert.equal(master.options.signal.aborted, true);
  assert.equal(state.signals.listenerCount('SIGINT'), 0);
  assert.equal(state.signals.listenerCount('SIGTERM'), 0);
  await assert.rejects(session.run('ssh', sshArgs), /공유 연결이 종료/);
});

test('noninteractive setup keeps native key and agent authentication without password prompts', async (t) => {
  const state = fixture(t);
  await state.open(false);
  assert.equal(option(state.calls[0].args, 'BatchMode'), 'yes');
  assert.ok(!state.calls[0].args.includes('PasswordAuthentication=no'));
});

test('failed native authentication removes the temporary directory and listeners', async (t) => {
  const state = fixture(t, { authFailure: true });
  await assert.rejects(state.open(), /최초 SSH 인증/);
  assert.equal(state.calls.length, 1);
  for (const directory of state.directories) await assert.rejects(access(directory), { code: 'ENOENT' });
  assert.equal(state.signals.listenerCount('SIGINT'), 0);
  assert.equal(state.signals.listenerCount('SIGTERM'), 0);
});

test('failed initial master check closes the connection without starting deployment work', async (t) => {
  const state = fixture(t, { disconnected: true });
  await assert.rejects(state.open(), /공유 연결 준비에 실패/);
  assert.equal(state.calls.filter((call) => call.args.includes('exit')).length, 1);
  for (const directory of state.directories) await assert.rejects(access(directory), { code: 'ENOENT' });
});

test('a lost master stops subsequent work without trying authentication again', async (t) => {
  const controls = {};
  const state = fixture(t, controls);
  const session = await state.open();
  controls.disconnected = true;
  await assert.rejects(session.run('ssh', sshArgs), /추가 비밀번호 입력 없이 중단/);
  assert.equal(state.calls.filter((call) => option(call.args, 'ControlMaster') === 'yes').length, 1);
  assert.ok(!state.calls.some((call) => call.args.includes('id -u')));
});

test('a remote command failure keeps the original error and remains closable', async (t) => {
  const controls = {};
  const state = fixture(t, controls);
  const session = await state.open();
  const error = new Error('remote validation failed');
  controls.commandFailure = error;
  await assert.rejects(session.run('ssh', sshArgs), (cause) => cause === error);
  await session.close();
  for (const directory of state.directories) await assert.rejects(access(directory), { code: 'ENOENT' });
});

test('rejects commands for another server before dispatch', async (t) => {
  const state = fixture(t);
  const session = await state.open();
  const count = state.calls.length;
  await assert.rejects(session.run('ssh', ['other@127.0.0.2', 'true']), /다른 서버/);
  await assert.rejects(session.run('scp', ['artifact.tar.gz', 'other@127.0.0.2:/tmp/artifact']), /다른 서버/);
  assert.equal(state.calls.length, count);
});

test('concurrent invocations have separate sockets and close only their own connection', async (t) => {
  const first = fixture(t);
  const second = fixture(t);
  const firstSession = await first.open();
  const secondSession = await second.open();
  const firstPath = option(first.calls[0].args, 'ControlPath');
  const secondPath = option(second.calls[0].args, 'ControlPath');
  assert.notEqual(firstPath, secondPath);
  await firstSession.close();
  await access(secondPath);
  await secondSession.run('ssh', sshArgs);
  assert.ok(first.calls.filter((call) => call.args.includes('exit')).every((call) => option(call.args, 'ControlPath') === firstPath));
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`${signal} aborts owned commands, closes the master and restores signal termination`, async (t) => {
    const state = fixture(t);
    const session = await state.open();
    state.signals.emit(signal);
    await session.close();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(state.calls[0].options.signal.aborted, true);
    assert.deepEqual(state.killed, [{ pid: 1234, signal }]);
    assert.equal(state.signals.listenerCount('SIGINT'), 0);
    assert.equal(state.signals.listenerCount('SIGTERM'), 0);
    for (const directory of state.directories) await assert.rejects(access(directory), { code: 'ENOENT' });
  });
}

test('an unconfirmed master exit preserves its private path and reports the idle timeout', async (t) => {
  const state = fixture(t, { exitFailure: true });
  const session = await state.open();
  await session.close();
  for (const directory of state.directories) await access(directory);
  assert.match(state.logs.join('\n'), /임시 경로를 보존.*최대 10분/);
});

test('native OpenSSH parses the effective master and shared-client settings', async (t) => {
  const state = fixture(t);
  const session = await state.open();
  await session.run('ssh', sshArgs);
  const shared = state.calls.find((call) => call.args.includes('id -u'));
  const masterConfig = await execute('ssh', ['-G', '-F', '/dev/null', ...state.calls[0].args], { timeout: 5000 });
  assert.match(masterConfig.stdout, /^controlmaster true$/m);
  assert.match(masterConfig.stdout, /^controlpersist 600$/m);
  assert.match(masterConfig.stdout, /^stricthostkeychecking true$/m);
  const sharedConfig = await execute('ssh', ['-G', '-F', '/dev/null', ...shared.args], { timeout: 5000 });
  for (const setting of ['batchmode yes', 'numberofpasswordprompts 0', 'passwordauthentication no', 'kbdinteractiveauthentication no', 'proxycommand false']) {
    assert.ok(sharedConfig.stdout.split('\n').includes(setting), setting);
  }
});

test('native SSH and SCP cannot reconnect if the socket disappears after the master check', async (t) => {
  let connections = 0;
  const server = createServer((socket) => { connections++; socket.destroy(); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const state = fixture(t);
  const session = await state.open();
  const artifact = path.join(path.dirname(option(state.calls[0].args, 'ControlPath')), 'artifact.tar.gz');
  await writeFile(artifact, 'test artifact');
  await session.run('ssh', sshArgs);
  await session.run('scp', ['-P', '22', ...authenticationOptions(config, { interactive: true }), '--', artifact, `${destination}:/tmp/artifact`]);
  await rm(option(state.calls[0].args, 'ControlPath'));
  for (const call of state.calls.filter((entry) => entry.args.includes('id -u') || entry.command === 'scp')) {
    const args = [...call.args];
    args[args.indexOf(call.command === 'ssh' ? '-p' : '-P') + 1] = String(server.address().port);
    await assert.rejects(execute(call.command, ['-F', '/dev/null', ...args], { timeout: 5000 }), (error) => {
      assert.notEqual(error.code, 0);
      assert.equal(error.killed, false);
      assert.doesNotMatch(error.stderr, /password:/i);
      return true;
    });
  }
  assert.equal(connections, 0);
});
