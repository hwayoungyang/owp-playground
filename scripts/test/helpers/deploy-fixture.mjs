import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { createArtifact } from '../../deploy-artifact.mjs';
import { stageRelease } from '../../deploy-staging.mjs';
import { transferArtifact } from '../../deploy-transfer.mjs';
import { activateRelease } from '../../deploy-activation.mjs';

const execute = promisify(execFile);

export async function deploymentFixture(t) {
  const workspace = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-deployment-test-')));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const base = path.join(workspace, 'server');
  const directory = path.join(workspace, 'dist');
  const bin = path.join(workspace, 'bin');
  await mkdir(bin);
  await mkdir(path.join(base, 'releases/initial'), { recursive: true });
  await writeFile(path.join(base, 'releases/initial/index.html'), 'initial service');
  await writeFile(path.join(base, 'releases/initial/robots.txt'), 'User-agent: *');
  await symlink('releases/initial', path.join(base, 'current'));
  await mkdir(path.join(directory, 'assets'), { recursive: true });
  for (const [file, contents] of Object.entries({
    'index.html': '<script src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">',
    'robots.txt': 'User-agent: *', 'packages.json': '{"packages":[{"name":"@owp/core"}]}',
    'assets/app.js': 'console.log("new release")', 'assets/app.css': 'body{margin:0}',
  })) await writeFile(path.join(directory, file), contents);
  const config = { host: '192.168.100.20', sshPort: 22, user: 'root', timeoutMs: 5000, remoteRoot: base, url: 'http://192.168.100.20:30010', container: 'owp-playground-nginx' };
  const controls = { fail: '', stale: false, containerDown: false, badMount: false, truncateReceipt: false };
  const controlsFile = path.join(workspace, 'controls.json');
  const shim = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.OWP_TEST_BASE;
const controls = JSON.parse(fs.readFileSync(process.env.OWP_TEST_CONTROLS));
const args = process.argv.slice(2);
if (path.basename(process.argv[1]) === 'id') {
  console.log('0');
} else if (path.basename(process.argv[1]) === 'docker') {
  if (args.includes('{{.State.Running}}')) console.log(!controls.containerDown);
  else console.log(controls.badMount ? path.join(base, 'current') : base);
} else {
  const url = new URL(args.at(-1));
  const current = fs.realpathSync(path.join(base, 'current'));
  const isNew = path.basename(current) !== 'initial';
  const route = url.pathname;
  let code = '200';
  let body;
  if (route === '/health' && controls.failOnRestore && !isNew) {
    const counterFile = process.env.OWP_TEST_CONTROLS + '.health-count';
    const count = fs.existsSync(counterFile) ? Number(fs.readFileSync(counterFile)) + 1 : 1;
    fs.writeFileSync(counterFile, String(count));
    if (count > 1) code = '503';
    body = Buffer.from(count > 1 ? 'restore failed' : 'ok');
  } else if (controls.fail && (controls.failureRelease ? path.basename(current) === controls.failureRelease : isNew) && (controls.fail === 'all' || controls.fail === route)) { code = '503'; body = Buffer.from('failed'); }
  else if (route === '/health') body = Buffer.from('ok\n');
  else {
    const root = controls.stale && isNew ? path.join(base, 'releases/initial') : current;
    let file = route === '/' || route === '/__owp_deploy_check__' ? path.join(root, 'index.html') : path.join(root, route.slice(1));
    if (!fs.existsSync(file)) file = path.join(root, 'index.html');
    body = fs.readFileSync(file);
  }
  fs.writeFileSync(args[args.indexOf('--output') + 1], body);
  process.stdout.write(code);
}
`;
  for (const name of ['docker', 'curl', 'id']) await writeFile(path.join(bin, name), `#!${process.execPath}\n${shim}`, { mode: 0o755 });
  const calls = [];
  const run = async (command, args) => {
    calls.push({ command, args });
    if (command === 'scp') {
      await copyFile(args.at(-2), args.at(-1).slice(args.at(-1).indexOf(':') + 1));
      return;
    }
    assert.equal(command, 'ssh');
    await writeFile(controlsFile, JSON.stringify(controls));
    try {
      const { stdout } = await execute('bash', ['-c', args.at(-1)], {
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, OWP_TEST_BASE: base, OWP_TEST_CONTROLS: controlsFile },
        timeout: 25_000, maxBuffer: 8 * 1024 * 1024,
      });
      return controls.truncateReceipt ? '' : stdout;
    } catch (error) { throw new Error(`${error.stderr}\n${error.stdout}`); }
  };
  let sequence = 0;
  const prepare = async () => {
    const artifact = await createArtifact({ directory, context: { commit: '0123456789ab', packages: { '@owp/core': '6.1.0' }, dirty: true }, builtAt: new Date(Date.UTC(2026, 9, 19, 19, 0, sequence++)) });
    t.after(artifact.cleanup);
    const uploaded = await transferArtifact(config, artifact, { interactive: true, run, log() {} });
    const staged = await stageRelease(config, artifact, uploaded, { interactive: true, run });
    return { artifact, uploaded, staged };
  };
  const deploy = async () => {
    const prepared = await prepare();
    const result = await activateRelease(config, prepared.artifact, prepared.uploaded, prepared.staged, { interactive: true, run, verifyHealth: true });
    return { ...prepared, result };
  };
  const current = () => readlink(path.join(base, 'current'));
  return { workspace, base, directory, config, controls, calls, run, prepare, deploy, current };
}
