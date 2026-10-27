import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { VersionArchiveError } from '../scripts/version-archive.ts';
import { createKnowledgeStore, KnowledgeError, type KnowledgeOptions } from './knowledge.ts';
import { createKnowledgeServer } from './server.ts';

export type HttpOptions = KnowledgeOptions & {
  readonly host?: string;
  readonly port?: number;
  readonly bearerToken?: string;
  readonly serveArchives?: boolean;
};

const contentTypes: Readonly<Record<string, string>> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  jsonl: 'application/x-ndjson; charset=utf-8',
  ts: 'text/plain; charset=utf-8',
  tsx: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  woff2: 'font/woff2',
  txt: 'text/plain; charset=utf-8',
};

function respond(response: ServerResponse, status: number, body: string) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function authorized(request: IncomingMessage, token: string | undefined) {
  if (!token) return true;
  const actual = Buffer.from(request.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function startKnowledgeHttpServer(options: HttpOptions) {
  const host = options.host ?? '127.0.0.1';
  const store = createKnowledgeStore(options);
  const handler = createMcpHandler(() => createKnowledgeServer(options, store), {
    maxRequestBodySize: 65536,
  });
  const nodeHandler = toNodeHandler(handler, { maxRequestBodySize: 65536 });
  const publicUrl = options.publicUrl ? new URL(options.publicUrl) : undefined;
  const allowedHosts = new Set([
    host.toLowerCase(),
    ...(host === '127.0.0.1' || host === '::1' || host === 'localhost'
      ? ['localhost', '127.0.0.1', '[::1]']
      : []),
    ...(publicUrl ? [publicUrl.hostname.toLowerCase()] : []),
  ]);
  allowedHosts.delete('0.0.0.0');
  allowedHosts.delete('::');
  const server = createServer(async (request, response) => {
    // no-excuse-ok: catch
    try {
      const rawHost = request.headers.host;
      if (
        !rawHost ||
        !/^(?:\[[0-9a-fA-F:]+\]|[a-zA-Z0-9.-]+)(?::\d{1,5})?$/.test(rawHost) ||
        !allowedHosts.has(new URL(`http://${rawHost}`).hostname.toLowerCase())
      )
        return respond(response, 403, 'Host가 허용되지 않습니다.');
      const origin = request.headers.origin;
      if (origin) {
        const parsed = new URL(origin);
        const requestHost = new URL(`http://${rawHost}`);
        if (
          !['http:', 'https:'].includes(parsed.protocol) ||
          parsed.username ||
          parsed.password ||
          parsed.origin !== origin ||
          !(parsed.host === requestHost.host || parsed.origin === publicUrl?.origin)
        )
          return respond(response, 403, 'Origin이 허용되지 않습니다.');
      }
      if (!authorized(request, options.bearerToken)) {
        response.setHeader('WWW-Authenticate', 'Bearer');
        return respond(response, 401, '인증이 필요합니다.');
      }
      const rawPath = (request.url ?? '/').split('?')[0] ?? '/';
      const decoded = decodeURIComponent(rawPath);
      if (
        decoded.includes('\\') ||
        decoded.includes('\0') ||
        decoded.split('/').some((part) => part === '..' || part === '.')
      )
        return respond(response, 400, '경로가 올바르지 않습니다.');
      if (decoded === '/mcp') return await nodeHandler(request, response);
      if (options.serveArchives === false) return respond(response, 404, '리소스가 없습니다.');
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        return respond(response, 405, '읽기 요청만 지원합니다.');
      }
      if (decoded === '/') {
        const location = `/versions/${await store.latestReleaseId()}/${new URL(request.url ?? '/', 'http://localhost').search}`;
        response.writeHead(307, { Location: location, 'Cache-Control': 'no-store' });
        return response.end();
      }
      if (decoded === '/versions/index.json') {
        const content = JSON.stringify(await store.versionIndex());
        response.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Length': Buffer.byteLength(content),
        });
        return response.end(request.method === 'HEAD' ? undefined : content);
      }
      if (decoded === '/version-ui/manifest.json') {
        const content = JSON.stringify(await store.presentationManifest());
        response.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Length': Buffer.byteLength(content),
        });
        return response.end(request.method === 'HEAD' ? undefined : content);
      }
      const rawHtml = /^\/version-ui\/raw\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})\/index.html$/.exec(
        decoded,
      );
      if (rawHtml?.[1]) {
        const bytes = await store.readStatic(rawHtml[1], 'index.html');
        response.writeHead(200, {
          'Content-Type': contentTypes.html,
          'Content-Length': bytes.length,
          'Cache-Control': options.bearerToken
            ? 'private, no-store'
            : 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        });
        return response.end(request.method === 'HEAD' ? undefined : bytes);
      }
      const match = /^\/versions\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})\/(.*)$/.exec(decoded);
      if (!match?.[1] || match[2] === undefined)
        return respond(response, 404, '리소스가 없습니다.');
      const file = match[2] === '' ? 'index.html' : match[2];
      const presentation = file === 'index.html';
      const bytes = presentation
        ? await store.readPresentation(match[1])
        : await store.readStatic(match[1], file);
      response.writeHead(200, {
        'Content-Type': contentTypes[file.split('.').at(-1) ?? ''] ?? 'application/octet-stream',
        'Content-Length': bytes.length,
        'Cache-Control': options.bearerToken
          ? 'private, no-store'
          : presentation
            ? 'no-store'
            : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (response.headersSent) {
        response.destroy(error instanceof Error ? error : undefined);
        return;
      }
      if (error instanceof URIError || error instanceof TypeError)
        return respond(response, 400, '요청 형식이 올바르지 않습니다.');
      if (error instanceof KnowledgeError) return respond(response, 404, '리소스가 없습니다.');
      if (error instanceof VersionArchiveError)
        return respond(
          response,
          error.code === 'INTEGRITY_MISMATCH' ? 409 : 404,
          'archive 리소스를 읽을 수 없습니다.',
        );
      respond(response, 500, '요청을 처리하지 못했습니다.');
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 30011, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new KnowledgeError('LISTEN_FAILED', 'HTTP 서버 주소를 확인할 수 없습니다.');
  return {
    server,
    port: address.port,
    host,
    async close() {
      await handler.close();
      server.closeIdleConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
