import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { startKnowledgeHttpServer } from '../../mcp/http.ts';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { verifyMcpDeployment } from '../deploy-mcp-verify.mjs';
import { mcpFixture, writeMcpFixtureBundle } from './deploy-mcp-fixture.mjs';

async function serve(t, fixture, options = {}) {
  const server = await startKnowledgeHttpServer({ archiveRoot: fixture.archiveRoot, port: 0, ...options });
  t.after(() => server.close());
  return { url: `http://127.0.0.1:${server.port}`, timeoutMs: 5000 };
}
test('Given a real local HTTP MCP server, When verified with the SDK, Then initialize, list_packages and per-package fixed-release get_guide succeed', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture, { bearerToken: 'local-only-secret' });
  await assert.rejects(verifyMcpDeployment(config, bundle, { bearerToken: '' }), /307/);
  const result = await verifyMcpDeployment(config, bundle, { bearerToken: 'local-only-secret' });
  assert.deepEqual(result, { http: true, mcp: true, releaseId: bundle.metadata.releaseId, packages: 1, guides: 1 });
});
test('Given a 200 response containing stale HTML, When verified, Then file SHA-256 refuses it', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture);
  const fetchStale = (url, init) => String(url).endsWith('/index.html') ? Promise.resolve(new Response('stale HTML', { status: 200 })) : fetch(url, init);
  await assert.rejects(verifyMcpDeployment(config, bundle, { fetch: fetchStale }), /HTTP 파일 내용/);
});
test('Given immutable caching on mutable presentation HTML, When verified, Then the deployment check refuses the cache policy', async (t) => {
  // Given
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture);
  const fetchCached = async (url, init) => {
    const response = await fetch(url, init);
    if (!String(url).endsWith('/index.html') || String(url).includes('/version-ui/raw/')) return response;
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(response.body, { status: response.status, headers });
  };
  // When / Then
  await assert.rejects(verifyMcpDeployment(config, bundle, { fetch: fetchCached }), /cache 정책/);
});
test('Given static files from the expected release and MCP from another real server, When verified, Then the actual SDK rejects the mismatched release', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const expected = await serve(t, fixture);
  const other = await mcpFixture(t);
  await writeMcpFixtureBundle(other, { releaseId: '20261024-120000-0123456789ab', createdAt: '2026-10-24T03:00:00.000Z' });
  const wrong = await serve(t, other);
  const fetchMixed = (url, init) => fetch(String(url).endsWith('/mcp') ? `${wrong.url}/mcp` : url, init);
  await assert.rejects(verifyMcpDeployment(expected, bundle, { fetch: fetchMixed }), /MCP list_packages/);
});
test('Given a real server that begins listening after verification starts, When readiness retries, Then full HTTP and MCP checks eventually pass', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  let handle;
  const delayed = new Promise((resolve, reject) => {
    setTimeout(() => startKnowledgeHttpServer({ archiveRoot: fixture.archiveRoot, port }).then((server) => { handle = server; resolve(); }, reject), 150);
  });
  t.after(async () => { await delayed; await handle.close(); });
  const result = await verifyMcpDeployment({ url: `http://127.0.0.1:${port}`, timeoutMs: 1000 }, bundle, { readinessTimeoutMs: 2000, retryDelayMs: 25 });
  assert.equal(result.mcp, true);
  assert.equal(result.releaseId, bundle.metadata.releaseId);
});
