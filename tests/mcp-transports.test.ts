import { request } from 'node:http';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKnowledgeHttpServer } from '../mcp/http.ts';
import { createMcpFixture } from '../mcp/test-fixture.ts';

let root: string;
const cleanup: (() => Promise<void>)[] = [];
beforeEach(async () => {
  root = await createMcpFixture();
});
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
  await rm(root, { recursive: true, force: true });
});
async function httpServer(options: { readonly bearerToken?: string } = {}) {
  const server = await startKnowledgeHttpServer({ archiveRoot: root, port: 0, ...options });
  cleanup.push(() => server.close());
  return `http://127.0.0.1:${server.port}`;
}
async function wire(
  url: string,
  route: string,
  options: {
    readonly method?: string;
    readonly headers?: Readonly<Record<string, string>>;
    readonly body?: string;
  } = {},
) {
  return new Promise<{
    readonly status: number;
    readonly body: string;
    readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  }>((resolve, reject) => {
    const target = new URL(url);
    const req = request(
      {
        hostname: target.hostname,
        port: target.port,
        path: route,
        method: options.method ?? 'GET',
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
            headers: res.headers,
          }),
        );
      },
    );
    req.on('error', reject);
    req.end(options.body);
  });
}

describe('real MCP SDK transports', () => {
  for (const transport of ['http', 'stdio'] as const) {
    it(`handshakes, lists five tools, calls tools and reads resources when using ${transport}`, async () => {
      // Given
      const client = new Client({ name: 'owp-knowledge-test', version: '1.0.0' });
      const channel =
        transport === 'http'
          ? new StreamableHTTPClientTransport(new URL(`${await httpServer()}/mcp`))
          : new StdioClientTransport({
              command: process.execPath,
              args: [
                '--experimental-strip-types',
                path.resolve('mcp/cli.ts'),
                '--archive-root',
                root,
              ],
              cwd: path.resolve('.'),
              stderr: 'pipe',
            });
      cleanup.push(() => client.close());
      // When
      await client.connect(channel);
      const tools = await client.listTools();
      const packages = await client.callTool({ name: 'list_packages', arguments: {} });
      const api = await client.callTool({
        name: 'get_api',
        arguments: {
          package: 'datagrid',
          symbol: 'OwpDataGrid',
          releaseId: 'release-old',
          version: '1.0.0',
        },
      });
      const example = await client.callTool({
        name: 'get_example',
        arguments: { package: 'charts', exampleId: 'basic', includeDependencies: true },
      });
      const guide = await client.callTool({
        name: 'get_guide',
        arguments: { package: 'datagrid' },
      });
      const search = await client.callTool({
        name: 'search_knowledge',
        arguments: { package: 'charts', query: 'OWP', limit: 1 },
      });
      const resources = await client.listResources();
      const resourceResults = [];
      for (const kind of ['api', 'guide', 'source']) {
        const uri = resources.resources.find((resource) => resource.uri.includes(`/${kind}/`))?.uri;
        if (!uri) throw new TypeError(`resource가 없습니다: ${kind}`);
        resourceResults.push(await client.readResource({ uri }));
      }
      // Then
      expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
        'get_api',
        'get_example',
        'get_guide',
        'list_packages',
        'search_knowledge',
      ]);
      expect(tools.tools.every((tool) => tool.outputSchema && tool.annotations?.readOnlyHint)).toBe(
        true,
      );
      expect(packages.structuredContent).toMatchObject({ releaseId: 'release-new' });
      expect(api.structuredContent).toMatchObject({
        releaseId: 'release-old',
        packageVersion: '1.0.0',
      });
      expect(example.structuredContent).toMatchObject({ total: 2 });
      expect(guide.structuredContent).toMatchObject({ id: '@owp/datagrid:guide.connection' });
      expect(search.structuredContent).toMatchObject({ nextOffset: 1 });
      for (const resource of resourceResults) {
        const text = resource.contents[0];
        expect(text && 'text' in text ? JSON.parse(text.text) : null).toMatchObject({
          releaseId: 'release-new',
        });
      }
      expect(packages.content).toEqual([
        { type: 'text', text: JSON.stringify(packages.structuredContent) },
      ]);
    }, 15000);
  }
  it('returns a structured version error when a tool requests an unknown version', async () => {
    // Given
    const client = new Client({ name: 'owp-error-test', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${await httpServer()}/mcp`)));
    cleanup.push(() => client.close());
    // When
    const response = await client.callTool({
      name: 'get_api',
      arguments: { package: 'datagrid', symbol: 'OwpDataGrid', version: '99.0.0' },
    });
    // Then
    expect(response.isError).toBe(true);
    expect(response.structuredContent).toMatchObject({
      error: { code: 'VERSION_NOT_FOUND', availableVersions: ['1.0.0', '2.0.0'] },
    });
  });
});

describe('HTTP archive and request boundary', () => {
  it('redirects the root to a stable release when the archive latest pointer is a draft', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/');
    // Then
    expect(response.status).toBe(307);
    expect(response.headers.location).toBe('/versions/release-new/');
  });
  it('preserves the selected package and example when redirecting the root to an archived release', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/?package=charts&sample=basic');
    // Then
    expect(response.headers.location).toBe('/versions/release-new/?package=charts&sample=basic');
  });
  it('lists stable releases and rewrites latest when serving the version menu index', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/versions/index.json');
    // Then
    expect(JSON.parse(response.body)).toMatchObject({
      latestReleaseId: 'release-new',
      releases: [{ releaseId: 'release-old' }, { releaseId: 'release-new' }],
    });
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('returns index HEAD length without a response body when the version menu checks metadata', async () => {
    // Given
    const url = await httpServer();
    const get = await wire(url, '/versions/index.json');
    // When
    const response = await wire(url, '/versions/index.json', { method: 'HEAD' });
    // Then
    expect(response.body).toBe('');
    expect(response.headers['content-length']).toBe(String(Buffer.byteLength(get.body)));
  });
  it('includes draft releases when the server explicitly permits drafts', async () => {
    // Given
    const server = await startKnowledgeHttpServer({
      archiveRoot: root,
      port: 0,
      allowDrafts: true,
    });
    cleanup.push(() => server.close());
    // When
    const response = await wire(`http://127.0.0.1:${server.port}`, '/versions/index.json');
    // Then
    expect(JSON.parse(response.body)).toMatchObject({ latestReleaseId: 'release-draft' });
    expect(JSON.parse(response.body).releases).toHaveLength(3);
  });
  it('returns a real missing status when an archived route has no manifest file', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/versions/release-new/not-found');
    // Then
    expect(response.status).toBe(404);
  });
  it('returns HEAD headers without a body when reading an immutable archived asset', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/versions/release-old/index.html', { method: 'HEAD' });
    // Then
    expect(response.status).toBe(200);
    expect(response.body).toBe('');
    expect(response.headers['cache-control']).toContain('immutable');
  });
  for (const route of [
    '/versions/release-new/%2e%2e/api/datagrid.json',
    '/versions/release-new/..%2fapi/datagrid.json',
    '/versions/release-new/%5csecret',
  ]) {
    it(`rejects traversal when the raw HTTP route is ${route}`, async () => {
      // Given
      const url = await httpServer();
      // When
      const response = await wire(url, route);
      // Then
      expect(response.status).toBe(400);
    });
  }
  it('rejects a foreign Host when a request attempts DNS rebinding', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/mcp', { headers: { host: 'evil.example.test' } });
    // Then
    expect(response.status).toBe(403);
  });
  it('rejects a foreign Origin when the request uses an allowed Host', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/mcp', { headers: { origin: 'https://evil.example.test' } });
    // Then
    expect(response.status).toBe(403);
  });
  it('requires a bearer token when HTTP authentication is configured', async () => {
    // Given
    const url = await httpServer({ bearerToken: 'test-secret' });
    // When
    const response = await wire(url, '/versions/release-new/index.html');
    // Then
    expect(response.status).toBe(401);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  for (const method of ['GET', 'HEAD']) {
    it(`prevents shared caching when an authenticated archive ${method} succeeds`, async () => {
      // Given
      const url = await httpServer({ bearerToken: 'test-secret' });
      // When
      const response = await wire(url, '/versions/release-new/index.html', {
        method,
        headers: { authorization: 'Bearer test-secret' },
      });
      // Then
      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-store');
    });
  }
  it('rejects oversized bodies when an MCP request exceeds 64 KiB', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: 'x'.repeat(65536) }),
    });
    // Then
    expect(response.status).toBe(413);
  });
  it('does not expose drafts when HTTP uses the default stable policy', async () => {
    // Given
    const url = await httpServer();
    // When
    const response = await wire(url, '/versions/release-draft/index.html');
    // Then
    expect(response.status).toBe(404);
  });
});
