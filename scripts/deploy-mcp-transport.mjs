import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authenticationOptions } from './deploy-ssh-options.mjs';
import { shellQuote } from './deploy-mcp-config.mjs';
import { inspectMcpTar, sha256 } from './deploy-mcp-tar.mjs';
import { discardMcpBootstrap, mcpMaintenanceHelperNames } from './deploy-mcp-bootstrap.mjs';
import { inspectMcpDependencies, MCP_DEPENDENCIES_FILE } from './deploy-mcp-offline-format.mjs';
import { mcpDeploymentDemands } from './deploy-mcp-storage.mjs';

export const mcpHelperNames = ['config', 'preflight', 'tar', 'archive', 'unit', 'transaction', 'remote', 'offline-format', 'retention', 'storage'].map((part) => `deploy-mcp-${part}.mjs`);
const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64');
const ssh = (config, command, execution) => execution.run('ssh', ['-p', String(config.sshPort), ...authenticationOptions(config, execution), `${config.user}@${config.host}`, command], { capture: true });
const result = (output) => {
  const failure = output.trim().split('\n').findLast((item) => item.startsWith('OWP_MCP_ERROR '));
  if (failure) {
    const error = JSON.parse(failure.slice('OWP_MCP_ERROR '.length));
    if (typeof error?.message !== 'string' || !error.message || error.message.length > 16384) throw new Error('서버 오류 응답의 형식이 올바르지 않습니다.');
    throw new Error(error.message);
  }
  const line = output.trim().split('\n').findLast((item) => item.startsWith('OWP_MCP_RESULT '));
  if (!line) throw new Error('서버가 검증 가능한 MCP 배포 결과를 반환하지 않았습니다.');
  return JSON.parse(line.slice('OWP_MCP_RESULT '.length));
};
export async function pinMcpHelpers(bundle) {
  const files = [];
  for (const name of mcpHelperNames) {
    const bytes = await readFile(new URL(name, import.meta.url));
    await writeFile(path.join(bundle.directory, name), bytes, { flag: 'wx', mode: 0o600 });
    files.push({ name, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return files;
}
const runtimeCommand = (plan) => plan.runtime ? `env PATH=${shellQuote(`${plan.runtime.directory}/bin:/usr/sbin:/usr/bin:/sbin:/bin`)} COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_PROJECT_SPEC=0 npm_config_manage_package_manager_versions=false ${shellQuote(plan.runtime.node)}` : 'node';
export async function preflightMcpRemote(config, execution, options = {}) {
  const source = await readFile(new URL('./deploy-mcp-preflight.mjs', import.meta.url), 'utf8');
  const script = `${source}\nconst {config,options} = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8')); console.log('OWP_MCP_RESULT ' + JSON.stringify(await inspectMcpServer(config, options)));`;
  const missingNode = 'OWP_MCP_PREFLIGHT_NODE_MISSING';
  const invoke = `${runtimeCommand(options)} --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded({ config, options }))}`;
  const output = await ssh(config, options.runtime ? `test "$(id -u)" -eq 0 && ${invoke}` : `test "$(id -u)" -eq 0 && if command -v node >/dev/null 2>&1; then ${invoke}; else printf '%s\\n' ${shellQuote(missingNode)}; fi`, execution);
  if (output.trim().split('\n').includes(missingNode)) throw new Error('서버에서 node 명령을 찾지 못했습니다. Node.js 24.22.1을 서버에 준비하고 비대화형 SSH의 PATH에서 node를 실행할 수 있도록 설정해 주세요. 런타임은 자동 설치하지 않습니다.');
  return result(output);
}
export async function createMcpIncoming(plan, execution) {
  const script = `const fs = await import('node:fs/promises'); const path = await import('node:path'); const p=JSON.parse(Buffer.from(process.argv[1],'base64')); let here='/'; for(const part of p.config.remoteRoot.slice(1).split('/')) {here=path.join(here,part); try {const s=await fs.lstat(here); if(!s.isDirectory()||s.isSymbolicLink()) throw Error('실제 배포 디렉터리가 필요합니다.');} catch(e){if(e.code!=='ENOENT')throw e;await fs.mkdir(here,{mode:0o755});}} const root=p.config.remoteRoot; await fs.mkdir(root+'/.deploy.lock',{mode:0o700}); await fs.writeFile(root+'/.deploy.lock/owner',p.owner,{flag:'wx',mode:0o600}); await fs.mkdir(root+'/.incoming-'+p.owner,{mode:0o700}); await fs.writeFile(root+'/.incoming-'+p.owner+'/owner',p.owner,{flag:'wx',mode:0o600});`;
  await ssh(plan.config, `node --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded(plan))}`, execution);
}
export async function transferMcpBundle(plan, bundle, execution) {
  const config = plan.config;
  const directory = `${config.remoteRoot}/.incoming-${plan.owner}`;
  const files = plan.files.filter((file) => !plan.runtime || !['runtime-node', 'runtime-pnpm'].includes(file.name));
  await execution.run('scp', ['-P', String(config.sshPort), ...authenticationOptions(config, execution), ...files.map((file) => path.join(bundle.directory, file.name)), `${config.user}@${config.host}:${directory}/`]);
}
export async function prepareMcpStoragePlan(plan, bundle) {
  return mcpDeploymentDemands(plan, {
    app: inspectMcpTar(await readFile(path.join(bundle.directory, 'app.tar.gz'))),
    archive: inspectMcpTar(await readFile(path.join(bundle.directory, 'archive.tar.gz'))),
    dependencies: inspectMcpDependencies(await readFile(path.join(bundle.directory, MCP_DEPENDENCIES_FILE)), plan.offline),
  });
}
export async function maintainMcpRemote(plan, execution) {
  const incoming = `${plan.config.remoteRoot}/.incoming-${plan.owner}`;
  const helpers = plan.files.filter((file) => mcpMaintenanceHelperNames.includes(file.name));
  if (helpers.length !== mcpMaintenanceHelperNames.length) throw new Error('정리 helper SHA 목록이 완전하지 않습니다.');
  const checklist = helpers.map((file) => `${file.sha256}  ${incoming}/${file.name}`).join('\n');
  const script = `
const p = JSON.parse(Buffer.from(process.argv[1], 'base64'));
const incoming = p.config.remoteRoot + '/.incoming-' + p.owner;
const { pathToFileURL } = await import('node:url');
const { readFile } = await import('node:fs/promises');
const { inspectMcpServer, optionalStat } = await import(pathToFileURL(incoming + '/deploy-mcp-preflight.mjs'));
const { maintainMcpDeployment } = await import(pathToFileURL(incoming + '/deploy-mcp-retention.mjs'));
const { assertMcpStorage } = await import(pathToFileURL(incoming + '/deploy-mcp-storage.mjs'));
const server = await inspectMcpServer(p.config, { runtime: p.runtime, lockOwner: p.owner });
const cleanup = await maintainMcpDeployment({ ...p, incoming });
let extra = BigInt(Buffer.byteLength(JSON.stringify(server.previousManifest ?? {}))) * 12n;
for (const file of [server.unitPath, p.config.remoteRoot + '/deployment.json', p.config.remoteRoot + '/archive/versions/index.json']) {
  if (await optionalStat(file)) extra += BigInt((await readFile(file)).length) * 8n;
}
if (!Array.isArray(p.storageDemands) || !p.storageDemands.length) throw Error('검증된 용량 계획이 없습니다.');
const capacity = await assertMcpStorage([...p.storageDemands, { path: p.config.remoteRoot, bytes: String(extra), entries: '8' }]);
console.log('OWP_MCP_RESULT ' + JSON.stringify({ cleanup, capacity }));`;
  return result(await ssh(plan.config, `set -eu; printf '%s\\n' ${shellQuote(checklist)} | sha256sum -c - >/dev/null; ${runtimeCommand(plan)} --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded(plan))}`, execution));
}
export async function operateMcpRemote(operation, plan, execution) {
  if (!['activate', 'rollback', 'rollback-finalize', 'commit'].includes(operation)) throw new Error('지원하지 않는 배포 작업입니다.');
  const incoming = `${plan.config.remoteRoot}/.incoming-${plan.owner}`;
  const checklist = plan.files.map((file) => `${file.sha256}  ${file.name === 'runtime-node' && plan.runtime ? plan.runtime.node : file.name === 'runtime-pnpm' && plan.runtime ? plan.runtime.packageManager.command : `${incoming}/${file.name}`}`).join('\n');
  const command = `set -eu; printf '%s\\n' ${shellQuote(checklist)} | sha256sum -c - >/dev/null; set +e; owp_output=$(${runtimeCommand(plan)} ${shellQuote(`${incoming}/deploy-mcp-remote.mjs`)} ${shellQuote(operation)} ${shellQuote(encoded(plan))}); owp_status=$?; set -e; printf '%s\\n' "$owp_output"; if [ "$owp_status" -ne 0 ]; then case "$owp_output" in 'OWP_MCP_ERROR '*) ;; *) exit "$owp_status" ;; esac; fi`;
  return result(await ssh(plan.config, command, execution));
}
export async function discardMcpIncoming(plan, execution) {
  if (plan.offline) return discardMcpBootstrap(plan, execution);
  const script = `const fs=await import('node:fs/promises'); const p=JSON.parse(Buffer.from(process.argv[1],'base64')); const root=p.config.remoteRoot; const incoming=root+'/.incoming-'+p.owner; const lock=root+'/.deploy.lock'; for(const d of [incoming,lock]) {const s=await fs.lstat(d);if(!s.isDirectory()||s.isSymbolicLink()||await fs.readFile(d+'/owner','utf8')!==p.owner)throw Error('소유자가 달라 잠금을 보존합니다.');} try {await fs.lstat(incoming+'/transaction.json');throw Error('transaction이 있어 단순 정리를 거부합니다.');}catch(e){if(e.code!=='ENOENT')throw e;} await fs.rm(incoming,{recursive:true});await fs.rm(lock+'/owner');await fs.rmdir(lock);`;
  await ssh(plan.config, `node --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded(plan))}`, execution);
}
