import path from 'node:path';
import { managedMarker } from './deploy-mcp-preflight.mjs';

const unitQuote = (value) => `"${value}"`;
export function renderMcpUnit(config, node) {
  const root = config.remoteRoot;
  return `${managedMarker}\n[Unit]\nDescription=OWP versioned Playground and Knowledge MCP\nAfter=network.target\n\n[Service]\nType=simple\nWorkingDirectory=${root}/current\nEnvironment=NODE_ENV=production\nEnvironmentFile=-${root}/mcp.env\nExecStart=${[node, '--experimental-strip-types', path.join(root, 'current/mcp/cli.ts'), '--transport', 'http', '--archive-root', path.join(root, 'archive'), '--host', '0.0.0.0', '--port', String(config.listenPort), '--public-url', config.url].map(unitQuote).join(' ')}\nRestart=on-failure\nRestartSec=3\nNoNewPrivileges=true\nPrivateTmp=true\nProtectSystem=strict\nProtectHome=read-only\n\n[Install]\nWantedBy=multi-user.target\n`;
}
