import path from 'node:path';
import { parseArgs } from 'node:util';

export const mcpDeploymentConfig = Object.freeze({
  host: '192.168.100.20', sshPort: 22, user: 'root', timeoutMs: 5000,
  remoteRoot: '/opt/owp-playground-mcp', url: 'http://192.168.100.20:30011',
  listenPort: 30011, service: 'owp-playground-mcp', unitDirectory: '/etc/systemd/system',
});

export function validateMcpConfig(input) {
  const config = { ...mcpDeploymentConfig, ...input };
  for (const key of Object.keys(config)) if (!Object.hasOwn(mcpDeploymentConfig, key)) throw new Error(`지원하지 않는 배포 설정입니다: ${key}`);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(config.host) || !/^[a-z_][a-z0-9_-]*$/.test(config.user)) throw new Error('SSH host 또는 user 설정이 올바르지 않습니다.');
  for (const key of ['sshPort', 'listenPort']) if (!Number.isInteger(config[key]) || config[key] < 1 || config[key] > 65535) throw new Error(`${key} 범위가 올바르지 않습니다.`);
  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 100 || config.timeoutMs > 60000) throw new Error('timeoutMs 범위가 올바르지 않습니다.');
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(config.service)) throw new Error('systemd service 이름이 올바르지 않습니다.');
  for (const key of ['remoteRoot', 'unitDirectory']) {
    if (typeof config[key] !== 'string' || !/^\/(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(config[key]) || path.posix.normalize(config[key]) !== config[key]) throw new Error(`${key}에는 안전한 절대 경로가 필요합니다.`);
  }
  if (config.remoteRoot === config.unitDirectory || config.remoteRoot.startsWith(`${config.unitDirectory}/`)) throw new Error('배포 root와 unit 디렉터리가 충돌합니다.');
  const url = new URL(config.url);
  if (url.protocol !== 'http:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.hostname !== config.host || Number(url.port || 80) !== config.listenPort || config.url !== url.origin) throw new Error('공개 URL은 SSH host와 MCP port를 사용하는 HTTP origin이어야 합니다.');
  return Object.freeze(config);
}

export function parseMcpDeployOptions(args) {
  const { values } = parseArgs({ args: args[0] === '--' ? args.slice(1) : args, strict: true, allowPositionals: false, options: {
    bundle: { type: 'string' }, help: { type: 'boolean', short: 'h' },
    'assume-vpn': { type: 'boolean' }, 'dry-run': { type: 'boolean' }, 'preflight-only': { type: 'boolean' },
  } });
  if (values.bundle !== undefined && !values.bundle.trim()) throw new Error('--bundle DIR에는 비어 있지 않은 경로가 필요합니다.');
  if (values['dry-run'] && values['preflight-only']) throw new Error('--dry-run과 --preflight-only는 함께 사용할 수 없습니다.');
  return { bundle: values.bundle, help: values.help ?? false, assumeVpn: values['assume-vpn'] ?? false, dryRun: values['dry-run'] ?? false, preflightOnly: values['preflight-only'] ?? false };
}

export const shellQuote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
