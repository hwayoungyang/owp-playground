import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { bundlePinSchema } from './model.ts';
import { createCompanyKnowledgeServer } from './server.ts';

const help = `회사 전용 OWP Knowledge MCP (stdio)
node --experimental-strip-types mcp/company/cli.ts --bundle-root PATH --company-id ID --build-id ID --manifest-digest SHA256 --release-id ID --bundle-digest SHA256
모든 식별자는 필수이며 시작 후 변경할 수 없습니다. HTTP·전체 archive·프로필 선택 옵션은 제공하지 않습니다.
`;
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'bundle-root': { type: 'string' },
      'company-id': { type: 'string' },
      'build-id': { type: 'string' },
      'manifest-digest': { type: 'string' },
      'release-id': { type: 'string' },
      'bundle-digest': { type: 'string' },
      help: { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help) {
    process.stdout.write(help);
    return;
  }
  if (!values['bundle-root']) throw new TypeError('--bundle-root가 필요합니다.');
  const pin = bundlePinSchema.parse({
    companyId: values['company-id'],
    buildId: values['build-id'],
    manifestDigest: values['manifest-digest'],
    releaseId: values['release-id'],
    bundleDigest: values['bundle-digest'],
  });
  const server = createCompanyKnowledgeServer({ bundleRoot: resolve(values['bundle-root']), pin });
  const handle = serveStdio(() => server, {
    onerror: (error) => process.stderr.write(`회사 MCP 오류: ${error.name}\n`),
  });
  const shutdown = () => {
    void handle.close().catch((error: unknown) => {
      // no-excuse-ok: catch
      process.stderr.write(
        `회사 MCP 종료 실패: ${error instanceof Error ? error.name : 'unknown'}\n`,
      );
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.stdin.once('end', shutdown);
}
main().catch((error: unknown) => {
  // no-excuse-ok: catch
  process.stderr.write(`회사 MCP 시작 실패: ${error instanceof Error ? error.name : 'unknown'}\n`);
  process.exitCode = 1;
});
