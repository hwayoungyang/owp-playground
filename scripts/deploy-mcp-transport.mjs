import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authenticationOptions } from './deploy-ssh-options.mjs';
import { shellQuote } from './deploy-mcp-config.mjs';
import { sha256 } from './deploy-mcp-tar.mjs';

export const mcpHelperNames = ['config', 'preflight', 'tar', 'archive', 'unit', 'transaction', 'remote'].map((part) => `deploy-mcp-${part}.mjs`);
const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64');
const ssh = (config, command, execution) => execution.run('ssh', ['-p', String(config.sshPort), ...authenticationOptions(config, execution), `${config.user}@${config.host}`, command], { capture: true });
const result = (output) => {
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
export async function preflightMcpRemote(config, execution) {
  const source = await readFile(new URL('./deploy-mcp-preflight.mjs', import.meta.url), 'utf8');
  const script = `${source}\nconst config = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8')); console.log('OWP_MCP_RESULT ' + JSON.stringify(await inspectMcpServer(config)));`;
  return result(await ssh(config, `test "$(id -u)" -eq 0 && node --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded(config))}`, execution));
}
export async function createMcpIncoming(plan, execution) {
  const script = `const fs = await import('node:fs/promises'); const path = await import('node:path'); const p=JSON.parse(Buffer.from(process.argv[1],'base64')); let here='/'; for(const part of p.config.remoteRoot.slice(1).split('/')) {here=path.join(here,part); try {const s=await fs.lstat(here); if(!s.isDirectory()||s.isSymbolicLink()) throw Error('실제 배포 디렉터리가 필요합니다.');} catch(e){if(e.code!=='ENOENT')throw e;await fs.mkdir(here,{mode:0o755});}} const root=p.config.remoteRoot; await fs.mkdir(root+'/.deploy.lock',{mode:0o700}); await fs.writeFile(root+'/.deploy.lock/owner',p.owner,{flag:'wx',mode:0o600}); await fs.mkdir(root+'/.incoming-'+p.owner,{mode:0o700}); await fs.writeFile(root+'/.incoming-'+p.owner+'/owner',p.owner,{flag:'wx',mode:0o600});`;
  await ssh(plan.config, `node --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded(plan))}`, execution);
}
export async function transferMcpBundle(plan, bundle, execution) {
  const config = plan.config;
  const directory = `${config.remoteRoot}/.incoming-${plan.owner}`;
  await execution.run('scp', ['-P', String(config.sshPort), ...authenticationOptions(config, execution), ...plan.files.map((file) => path.join(bundle.directory, file.name)), `${config.user}@${config.host}:${directory}/`]);
}
export async function operateMcpRemote(operation, plan, execution) {
  if (!['activate', 'rollback', 'rollback-finalize', 'commit'].includes(operation)) throw new Error('지원하지 않는 배포 작업입니다.');
  const incoming = `${plan.config.remoteRoot}/.incoming-${plan.owner}`;
  const checklist = plan.files.map((file) => `${file.sha256}  ${incoming}/${file.name}`).join('\n');
  const command = `set -eu; printf '%s\\n' ${shellQuote(checklist)} | sha256sum -c - >/dev/null; node ${shellQuote(`${incoming}/deploy-mcp-remote.mjs`)} ${shellQuote(operation)} ${shellQuote(encoded(plan))}`;
  return result(await ssh(plan.config, command, execution));
}
export async function discardMcpIncoming(plan, execution) {
  const script = `const fs=await import('node:fs/promises'); const p=JSON.parse(Buffer.from(process.argv[1],'base64')); const root=p.config.remoteRoot; const incoming=root+'/.incoming-'+p.owner; const lock=root+'/.deploy.lock'; for(const d of [incoming,lock]) {const s=await fs.lstat(d);if(!s.isDirectory()||s.isSymbolicLink()||await fs.readFile(d+'/owner','utf8')!==p.owner)throw Error('소유자가 달라 잠금을 보존합니다.');} try {await fs.lstat(incoming+'/transaction.json');throw Error('transaction이 있어 단순 정리를 거부합니다.');}catch(e){if(e.code!=='ENOENT')throw e;} await fs.rm(incoming,{recursive:true});await fs.rm(lock+'/owner');await fs.rmdir(lock);`;
  await ssh(plan.config, `node --input-type=module -e ${shellQuote(script)} ${shellQuote(encoded(plan))}`, execution);
}
