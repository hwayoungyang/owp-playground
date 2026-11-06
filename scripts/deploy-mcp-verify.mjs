import { setTimeout } from 'node:timers/promises';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { releaseIndexSchema } from '../src/features/releases/model/schema.ts';
import { sha256 } from './deploy-mcp-tar.mjs';
import { createVersionPresentation, fileFingerprint, presentationEntrySchema, readVersionUiRuntime } from './version-presentation.ts';

const packageList = (packages) => packages.map(({ id, name, version }) => ({ id, name, version })).sort((a, b) => a.id.localeCompare(b.id));
const matchPackages = (actual, expected) => JSON.stringify(packageList(actual)) === JSON.stringify(packageList(expected));
function safeUrl(value) {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}

function safeDiagnostic(value, token) {
  let text = String(value).replace(/https?:\/\/\S+/gi, (url) => {
    try { return safeUrl(url); } catch { return '[redacted URL]'; }
  }).replace(/\bAuthorization\s*:\s*[^\r\n]+/gi, '[redacted header]').replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]');
  if (token) text = text.replaceAll(token, '[redacted]').replaceAll(encodeURIComponent(token), '[redacted]');
  return text.replace(/[\r\n\t]/g, ' ');
}

function errorDiagnostic(error, token, depth = 0) {
  if (depth > 5) return '[cause depth limit]';
  const details = [`name=${safeDiagnostic(error?.name ?? typeof error, token)}`];
  if (error?.code !== undefined) details.push(`code=${safeDiagnostic(error.code, token)}`);
  const message = error?.name === 'SdkHttpError' ? `MCP HTTP 응답 오류 (status=${Number(error.status)})` : error instanceof SyntaxError ? '응답 구문을 해석하지 못했습니다.' : error?.message ?? error;
  details.push(`message=${safeDiagnostic(message, token)}`);
  if (error?.cause) details.push(`cause={${errorDiagnostic(error.cause, token, depth + 1)}}`);
  if (Array.isArray(error?.errors)) details.push(`errors=[${error.errors.map((item) => errorDiagnostic(item, token, depth + 1)).join('; ')}]`);
  return details.join(' ');
}

async function responseBytes(response, maximum = 64 * 1024 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body ?? []) {
    bytes += chunk.length;
    if (bytes > maximum) throw new Error('HTTP 응답 크기 상한을 초과했습니다.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function verifyMcpDeploymentOnce(config, release, dependencies, stage) {
  const request = dependencies.fetch ?? globalThis.fetch;
  const token = dependencies.bearerToken ?? process.env.OWP_MCP_BEARER_TOKEN;
  const headers = { 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const fetchBounded = (url, init = {}) => request(url, { ...init, redirect: 'manual', signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(config.timeoutMs)]) : AbortSignal.timeout(config.timeoutMs) });
  const get = (route, policy, name = 'HTTP file') => stage(name, new URL(route, config.url), async () => {
    const response = await fetchBounded(new URL(route, config.url), { headers });
    if (response.status !== 200) throw new Error(`HTTP 검증에 실패했습니다: ${route} (${response.status})`);
    const cache = response.headers.get('cache-control') ?? '';
    const requiresNoStore = policy === 'presentation' || (policy === 'immutable' && token);
    const requiresImmutable = policy === 'immutable' && !token;
    if ((requiresNoStore && !cache.includes('no-store')) || (requiresImmutable && !cache.includes('immutable'))) throw new Error(`HTTP 파일 내용 또는 cache 정책이 배포 계약과 다릅니다: ${route}`);
    return responseBytes(response);
  });
  const manifest = release.manifest;
  await stage('HTTP root', `${config.url}/?owp_deploy_verify=1`, async () => {
    const root = await fetchBounded(`${config.url}/?owp_deploy_verify=1`, { headers });
    if (root.status !== 307 || root.headers.get('location') !== `${manifest.basePath}?owp_deploy_verify=1`) throw new Error('root 307 redirect의 릴리스 또는 query 보존이 다릅니다.');
    await responseBytes(root);
  });
  const index = releaseIndexSchema.parse(JSON.parse((await get('/versions/index.json', 'presentation', 'HTTP index')).toString('utf8')));
  const selected = index.releases.find((entry) => entry.releaseId === manifest.releaseId);
  if (index.latestReleaseId !== manifest.releaseId || index.releases.some((entry) => entry.channel !== 'stable') || !selected || !matchPackages(selected.packages, manifest.packages)) throw new Error('HTTP stable index의 latest·packages가 다릅니다.');
  if (release.index && release.index.releases.some((entry) => !index.releases.some((actual) => JSON.stringify(actual) === JSON.stringify(entry)))) throw new Error('HTTP index에서 배포 묶음의 릴리스가 누락되거나 변경됐습니다.');
  const verifyFile = async (file) => {
    const expected = manifest.files[file];
    if (!expected) throw new Error(`검증할 manifest 파일이 없습니다: ${file}`);
    const bytes = await get(`${manifest.basePath}${file}`, 'immutable', file.startsWith('api/') ? 'HTTP api' : file.startsWith('assets/') ? 'HTTP asset' : 'HTTP file');
    if (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256) throw new Error(`HTTP 파일 내용이 배포 묶음과 다릅니다: ${file}`);
    return bytes;
  };
  const presentationManifest = JSON.parse((await get('/version-ui/manifest.json', 'presentation', 'HTTP presentation manifest')).toString('utf8'));
  const presentation = presentationEntrySchema.parse(presentationManifest.releases?.find((entry) => entry.release?.releaseId === manifest.releaseId));
  if (presentation.rawPath !== `/version-ui/raw/${manifest.releaseId}/index.html` || JSON.stringify(presentation.raw) !== JSON.stringify(manifest.files['index.html']) || presentation.release.manifestSha256 !== selected.manifestSha256) throw new Error('HTTP 화면용 HTML manifest의 원본 SHA 또는 릴리스가 다릅니다.');
  const runtime = await readVersionUiRuntime(manifest.basePath, verifyFile);
  const raw = await get(presentation.rawPath, 'immutable', 'HTTP raw HTML');
  if (JSON.stringify(fileFingerprint(raw)) !== JSON.stringify(presentation.raw)) throw new Error('HTTP 파일 내용이 배포 묶음과 다릅니다: raw index.html');
  const projected = await get(`${manifest.basePath}index.html`, 'presentation', 'HTTP presentation HTML');
  if (runtime.fingerprint !== presentation.runtimeFingerprint || !projected.equals(createVersionPresentation(raw, selected, runtime)) || JSON.stringify(fileFingerprint(projected)) !== JSON.stringify(presentation.presentation)) throw new Error('HTTP 파일 내용이 배포 묶음과 다릅니다: presentation index.html');
  const asset = release.asset ?? Object.keys(manifest.files).find((file) => /^assets\/.+\.(?:js|css)$/.test(file));
  if (!asset) throw new Error('HTTP 검증에 사용할 실제 asset이 없습니다.');
  await verifyFile(asset);
  const client = new Client({ name: 'owp-mcp-deployment-check', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`${config.url}/mcp`), { requestInit: { headers, redirect: 'manual' }, fetch: fetchBounded });
  try {
    await stage('MCP initialize', `${config.url}/mcp`, () => client.connect(transport));
    const result = await stage('MCP list_packages', `${config.url}/mcp`, () => client.callTool({ name: 'list_packages', arguments: {} }, { timeout: config.timeoutMs }));
    const listed = result.structuredContent;
    if (result.isError || listed?.releaseId !== manifest.releaseId || !Array.isArray(listed.packages) || !matchPackages(listed.packages, manifest.packages)) throw new Error('MCP list_packages의 releaseId·패키지 버전이 다릅니다.');
    let guides = 0;
    for (const entry of manifest.packages) {
      const dataset = JSON.parse((await verifyFile(`api/${entry.id}.json`)).toString('utf8'));
      const guide = dataset.records.find((record) => record.kind === 'guide');
      if (!guide) continue;
      const response = await stage('MCP get_guide', `${config.url}/mcp`, () => client.callTool({ name: 'get_guide', arguments: { package: entry.id, releaseId: manifest.releaseId, version: entry.version, guideId: guide.id, maxChars: 100 } }, { timeout: config.timeoutMs }));
      const content = response.structuredContent;
      if (response.isError || content?.releaseId !== manifest.releaseId || content.packageVersion !== entry.version || content.package !== entry.name || content.id !== guide.id) throw new Error(`MCP get_guide의 릴리스 또는 버전이 다릅니다: ${entry.id}`);
      guides++;
    }
    return { http: true, mcp: true, releaseId: manifest.releaseId, packages: manifest.packages.length, guides };
  } finally { await client.close(); }
}

function connectionPending(error, depth = 0) {
  if (!error || depth > 5) return false;
  if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET'].includes(error.code) || error.name === 'TimeoutError') return true;
  return connectionPending(error.cause, depth + 1) || (Array.isArray(error.errors) && error.errors.some((item) => connectionPending(item, depth + 1)));
}

export async function verifyMcpDeployment(config, release, dependencies = {}) {
  const deadline = Date.now() + (dependencies.readinessTimeoutMs ?? 30000);
  const log = dependencies.log ?? (() => {});
  const token = dependencies.bearerToken ?? process.env.OWP_MCP_BEARER_TOKEN;
  for (let attempt = 1; ; attempt++) {
    let current;
    const stage = async (name, url, operation) => {
      current = { name, url: safeDiagnostic(safeUrl(url), token), started: Date.now() };
      const result = await operation();
      log(`MCP 검증 요청 완료: stage=${name} url=${current.url} elapsed=${Date.now() - current.started}ms attempt=${attempt}`);
      return result;
    };
    try { return await verifyMcpDeploymentOnce(config, release, dependencies, stage); }
    catch (error) {
      const request = `stage=${current?.name ?? '검증 준비'} url=${current?.url ?? safeDiagnostic(safeUrl(config.url), token)}`;
      const elapsed = current ? Date.now() - current.started : 0;
      const context = `${request} elapsed=${elapsed}ms attempt=${attempt}`;
      const diagnostic = errorDiagnostic(error, token);
      const remaining = Math.max(0, deadline - Date.now());
      if (!connectionPending(error) || remaining === 0) {
        log(`MCP 검증 실패: attempt=${attempt} ${request} elapsed=${elapsed}ms ${diagnostic} 재시도하지 않습니다 (${remaining === 0 ? 'readiness 대기 종료' : '재시도 대상이 아닌 오류'}).`);
        throw new Error(`MCP 배포 검증에 실패했습니다: ${context} ${diagnostic}`, { cause: error });
      }
      const delay = Math.min(dependencies.retryDelayMs ?? 500, Math.max(1, remaining));
      log(`MCP 검증 재시도: attempt=${attempt} elapsed=${elapsed}ms remaining=${remaining}ms delay=${delay}ms timeout=${config.timeoutMs}ms ${request} ${diagnostic}`);
      await setTimeout(delay);
    }
  }
}
