import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { installMcpDependencies } from '../deploy-mcp-remote.mjs';
import { operateMcpRemote, pinMcpHelpers, transferMcpBundle } from '../deploy-mcp-transport.mjs';
import { mcpFixture, stageMcpFixture } from './deploy-mcp-fixture.mjs';

const execute = promisify(execFile);
test('Given pinned helper files, When the real generated control command runs through a local SSH shim, Then it verifies SHA before executing', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const helpers = await pinMcpHelpers(bundle);
  bundle.transferFiles.push(...helpers);
  const plan = await stageMcpFixture(fixture, bundle);
  const calls = [];
  const execution = { interactive: false, run: async (command, args) => {
    calls.push({ command, args });
    assert.equal(command, 'ssh');
    return (await execute('/bin/sh', ['-c', args.at(-1)], { encoding: 'utf8', env: process.env })).stdout;
  } };
  assert.deepEqual(await operateMcpRemote('rollback', plan, execution), { rolledBack: true, changed: false });
  assert.ok(calls[0].args.includes('StrictHostKeyChecking=yes'));
  await writeFile(path.join(plan.incoming, 'deploy-mcp-unit.mjs'), 'tampered helper');
  await assert.rejects(operateMcpRemote('rollback', plan, execution));
  assert.equal(await readFile(path.join(plan.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
});
test('Given an explicit bundle, When SCP is planned, Then only frozen files and the fixed private incoming destination are passed', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const plan = { config: fixture.config, files: bundle.transferFiles, owner: '11111111-1111-4111-8111-111111111111' };
  let call;
  await transferMcpBundle(plan, bundle, { interactive: false, run: async (...args) => { call = args; } });
  assert.equal(call[0], 'scp');
  assert.ok(call[1].includes('StrictHostKeyChecking=yes'));
  assert.equal(call[1].at(-1), `root@127.0.0.1:${fixture.config.remoteRoot}/.incoming-${plan.owner}/`);
  assert.ok(bundle.transferFiles.every((file) => call[1].includes(path.join(bundle.directory, file.name))));
});
test('Given a local Corepack process shim, When dependencies install, Then prod, frozen lockfile and ignored lifecycle scripts are passed', async (t) => {
  const fixture = await mcpFixture(t);
  const bin = path.join(fixture.root, 'bin');
  await mkdir(bin);
  const output = path.join(fixture.root, 'corepack-call.json');
  const corepack = path.join(bin, 'corepack');
  await writeFile(corepack, `#!/usr/bin/env node\nimport{writeFileSync}from'node:fs';writeFileSync(${JSON.stringify(output)},JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),network:process.env.COREPACK_ENABLE_NETWORK}));`);
  await chmod(corepack, 0o755);
  const previous = process.env.PATH;
  process.env.PATH = `${bin}:${previous}`;
  try { await installMcpDependencies(fixture.bundle); }
  finally { process.env.PATH = previous; }
  const call = JSON.parse(await readFile(output, 'utf8'));
  assert.deepEqual(call.args, ['pnpm', 'install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--config.manage-package-manager-versions=false']);
  assert.equal(call.cwd, fixture.bundle);
  assert.equal(call.network, '0');
});
