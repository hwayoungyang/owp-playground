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

for (const [name, password] of [['single quote', "pa'ss"], ['double quote', 'pa"ss'], ['opening angle bracket', 'pa<ss'], ['closing angle bracket', 'pa>ss']]) test(`Given quoted URL userinfo with a ${name}, When the first request fails, Then complete URL secrets are redacted and request context survives`, async () => {
  const original = new TypeError(`transport failed https://user:${password}@example.test/mcp?token=query-secret#fragment-secret connection failed`, { cause: Object.assign(new Error('socket closed'), { code: 'ECONNRESET' }) });
  const logs = [];
  let requests = 0;
  await assert.rejects(verifyMcpDeployment({ url: 'https://safe.example.test', timeoutMs: 80 }, { manifest: { basePath: '/versions/test/' } }, {
    bearerToken: '', readinessTimeoutMs: 0,
    fetch: async () => { requests++; throw original; }, log: (line) => logs.push(line),
  }), (error) => {
    assert.equal(error.cause, original);
    assert.match(error.message, /stage=HTTP root url=https:\/\/safe\.example\.test\/ elapsed=\d+ms attempt=1/);
    assert.match(error.message, /name=TypeError message=transport failed .* connection failed cause=\{name=Error code=ECONNRESET message=socket closed\}/);
    assert.doesNotMatch(`${error.message}\n${logs.join('\n')}`, /user:|ss@example\.test|query-secret|fragment-secret|\?token=|#fragment/);
    assert.ok(!error.message.includes(password));
    return true;
  });
  assert.equal(requests, 1);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /attempt=1 stage=HTTP root url=https:\/\/safe\.example\.test\/ elapsed=\d+ms/);
  assert.match(logs[0], /재시도하지 않습니다/);
});

test('Given nested connection causes followed by a permanent failure, When readiness retries, Then the policy and final original cause survive safe diagnostics', async () => {
  const pending = new TypeError('Authorization: Bearer header-secret', { cause: new AggregateError([Object.assign(new Error('Bearer nested-secret'), { code: 'ECONNREFUSED' })]) });
  const final = new Error('Bearer message-secret https://user:password@example.test/mcp?token=query-secret#fragment-secret local-only-secret');
  const logs = [];
  let requests = 0;
  await assert.rejects(verifyMcpDeployment({ url: 'http://127.0.0.1:30011', timeoutMs: 80 }, { manifest: { basePath: '/versions/test/' } }, {
    bearerToken: 'local-only-secret', readinessTimeoutMs: 1000, retryDelayMs: 1,
    fetch: async () => { throw ++requests === 1 ? pending : final; }, log: (line) => logs.push(line),
  }), (error) => {
    assert.equal(error.cause, final);
    assert.match(error.message, /stage=HTTP root.*elapsed=\d+ms.*attempt=2/);
    assert.doesNotMatch(error.message, /message-secret|password|query-secret|fragment-secret|local-only-secret/);
    return true;
  });
  assert.equal(requests, 2);
  assert.equal(logs.filter((line) => line.startsWith('MCP 검증 재시도:')).length, 1);
  assert.match(logs[0], /attempt=1 .*remaining=\d+ms.*delay=1ms.*timeout=80ms.*cause=.*errors=.*code=ECONNREFUSED/);
  assert.doesNotMatch(logs.join('\n'), /Authorization|header-secret|nested-secret|message-secret|password|query-secret|fragment-secret|local-only-secret/);
});

test('Given a real local HTTP MCP server, When verified with the SDK, Then initialize, list_packages and per-package fixed-release get_guide succeed', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture, { bearerToken: 'local-only-secret' });
  await assert.rejects(verifyMcpDeployment(config, bundle, { bearerToken: '' }), /307/);
  const logs = [];
  const result = await verifyMcpDeployment(config, bundle, { bearerToken: 'local-only-secret', log: (line) => logs.push(line) });
  assert.deepEqual(result, { http: true, mcp: true, releaseId: bundle.metadata.releaseId, packages: 1, guides: 1 });
  for (const stage of ['HTTP', 'MCP initialize', 'MCP list_packages', 'MCP get_guide']) assert.ok(logs.some((line) => line.includes(`stage=${stage}`) && /elapsed=\d+ms/.test(line)), logs.join('\n'));
  assert.doesNotMatch(logs.join('\n'), /local-only-secret|Authorization/);
});

for (const phase of ['initialize', 'list_packages', 'get_guide']) test(`Given an MCP ${phase} transport failure, When verification ends, Then the stage, URL, duration and original cause are available without secrets`, async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture, { bearerToken: 'local-only-secret' });
  const logs = [];
  const original = new TypeError('Bearer unrelated-secret https://user:password@example.test/mcp?token=query-secret#fragment-secret local-only-secret', { cause: Object.assign(new Error('Bearer nested-secret'), { code: 'ECONNRESET' }) });
  const fetchFailed = async (url, init) => {
    const message = init.body && JSON.parse(init.body);
    if (message?.method === phase || message?.params?.name === phase) throw original;
    return fetch(url, init);
  };
  await assert.rejects(verifyMcpDeployment(config, bundle, { fetch: fetchFailed, readinessTimeoutMs: 0, bearerToken: 'local-only-secret', log: (line) => logs.push(line) }), (error) => {
    assert.match(error.message, new RegExp(`stage=MCP ${phase}`));
    assert.ok(error.message.includes(`${config.url}/mcp`));
    assert.match(error.message, /elapsed=\d+ms/);
    assert.equal(error.cause, original);
    assert.match(logs.join('\n'), /name=TypeError.*cause=.*name=Error.*code=ECONNRESET/);
    assert.doesNotMatch(`${error.message}\n${logs.join('\n')}`, /unrelated-secret|nested-secret|local-only-secret|password|query-secret|fragment-secret|Authorization/);
    return true;
  });
});

test('Given an MCP HTTP error containing a private response body, When verification fails, Then diagnostics retain the status and cause without logging the body', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture);
  const logs = [];
  const fetchFailed = (url, init) => String(url).endsWith('/mcp') ? Promise.resolve(new Response('private-response-body', { status: 500 })) : fetch(url, init);
  await assert.rejects(verifyMcpDeployment(config, bundle, { fetch: fetchFailed, bearerToken: '', log: (line) => logs.push(line) }), (error) => {
    assert.match(error.message, /stage=MCP initialize.*status=500/);
    assert.equal(error.cause.name, 'SdkHttpError');
    assert.match(error.cause.message, /private-response-body/);
    assert.doesNotMatch(`${error.message}\n${logs.join('\n')}`, /private-response-body/);
    return true;
  });
});

test('Given HTTP headers followed by a stalled body, When the request times out repeatedly, Then body time, unchanged request limits and readiness retry decisions are diagnosed', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const config = await serve(t, fixture);
  const timers = new Set();
  let requests = 0;
  const slow = createServer((_request, response) => {
    requests++;
    response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.write('{');
    const timer = setTimeout(() => { timers.delete(timer); response.end('}'); }, 500);
    timers.add(timer);
  });
  await new Promise((resolve) => slow.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    for (const timer of timers) clearTimeout(timer);
    slow.closeAllConnections();
    await new Promise((resolve) => slow.close(resolve));
  });
  const logs = [];
  const signals = [];
  const fetchSlow = (url, init) => {
    if (new URL(url).pathname !== '/versions/index.json') return fetch(url, init);
    const started = Date.now();
    init.signal.addEventListener('abort', () => signals.push(Date.now() - started), { once: true });
    return fetch(`http://127.0.0.1:${slow.address().port}/index`, init);
  };
  await assert.rejects(verifyMcpDeployment({ ...config, timeoutMs: 80 }, bundle, { fetch: fetchSlow, readinessTimeoutMs: 200, retryDelayMs: 5, log: (line) => logs.push(line) }), (error) => {
    assert.match(error.message, /stage=HTTP index.*\/versions\/index\.json.*elapsed=\d+ms/);
    assert.ok(Number(error.message.match(/elapsed=(\d+)ms/)[1]) >= 60, error.message);
    assert.ok(error.cause instanceof Error);
    return true;
  });
  assert.ok(requests >= 2, `requests=${requests}`);
  assert.equal(signals.length, requests);
  assert.ok(signals.every((elapsed) => elapsed >= 60 && elapsed < 400), JSON.stringify(signals));
  const retry = logs.filter((line) => line.startsWith('MCP 검증 재시도:'));
  assert.equal(retry.length, requests - 1);
  retry.forEach((line, index) => {
    assert.match(line, new RegExp(`attempt=${index + 1} `));
    assert.match(line, /elapsed=\d+ms.*remaining=\d+ms.*delay=\d+ms.*timeout=80ms/);
  });
  assert.match(logs.at(-1), new RegExp(`attempt=${requests} .*재시도하지 않습니다`));
  t.diagnostic(`body timeout attempts=${requests}, abort elapsed=${signals.join(',')}ms`);
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
