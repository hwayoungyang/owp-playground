import path from 'node:path';
import { parseArgs } from 'node:util';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { startKnowledgeHttpServer } from './http.ts';
import { createKnowledgeServer } from './server.ts';

const help = `OWP Knowledge MCP (읽기 전용)
node --experimental-strip-types mcp/cli.ts [options]
  --transport stdio|http   기본 stdio
  --archive-root PATH      기본 .playground-versions
  --host HOST              HTTP 기본 127.0.0.1
  --port PORT              HTTP 기본 30011
  --public-url URL         팀 사용자가 접근할 HTTP(S) 주소
  --allow-drafts           draft release 조회 허용 (기본 stable만 제공)
  --no-static              HTTP archive 파일 제공 중지
  --help
환경 변수 OWP_MCP_BEARER_TOKEN으로 HTTP bearer 인증을 설정합니다.
인증을 설정하지 않은 HTTP는 접근이 제한된 사설 서비스에서 실행하세요.
0.0.0.0 또는 ::에 바인딩하면 --public-url로 허용할 공개 주소를 지정하세요.
`;

async function main() {
  // no-excuse-ok: catch
  const { values } = parseArgs({
    options: {
      transport: { type: 'string', default: 'stdio' },
      'archive-root': { type: 'string', default: '.playground-versions' },
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '30011' },
      'public-url': { type: 'string' },
      'allow-drafts': { type: 'boolean', default: false },
      'no-static': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) {
    process.stdout.write(help);
    return;
  }
  const transport = z.enum(['stdio', 'http']).parse(values.transport);
  const port = z.coerce.number().int().min(1).max(65535).parse(values.port);
  const options = {
    archiveRoot: path.resolve(values['archive-root']),
    allowDrafts: values['allow-drafts'],
    ...(values['public-url'] ? { publicUrl: values['public-url'] } : {}),
  };
  const handle =
    transport === 'http'
      ? await startKnowledgeHttpServer({
          ...options,
          host: values.host,
          port,
          serveArchives: !values['no-static'],
          ...(process.env.OWP_MCP_BEARER_TOKEN
            ? { bearerToken: process.env.OWP_MCP_BEARER_TOKEN }
            : {}),
        })
      : serveStdio(() => createKnowledgeServer(options), {
          onerror: (error) => process.stderr.write(`MCP: ${error.name}\n`),
        });
  if (transport === 'http')
    process.stderr.write(`OWP Knowledge MCP: HTTP ${values.host}:${port}/mcp\n`);
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    try {
      await handle.close();
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      process.stderr.write(`MCP 종료 오류: ${error.name}\n`);
      process.exitCode = 1;
    }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  if (transport === 'stdio') process.stdin.once('end', shutdown);
}

main().catch((error: unknown) => {
  // no-excuse-ok: catch
  process.stderr.write(
    `MCP 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n`,
  );
  process.exitCode = 1;
});
