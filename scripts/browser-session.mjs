const connectionHelp = 'PLAYGROUND_BROWSER_CDP_URL에 이미 실행 중인 브라우저의 CDP endpoint를 지정하세요. 앱이 관리하는 브라우저나 기존 연결을 사용하며, 이 스크립트는 브라우저를 실행하지 않습니다.';

export function readBrowserEndpoint(environment = process.env) {
  const value = environment.PLAYGROUND_BROWSER_CDP_URL?.trim();
  if (!value) throw new Error(connectionHelp);
  let endpoint;
  try {
    endpoint = new URL(value);
  } catch {
    throw new TypeError(`CDP endpoint는 올바른 URL이어야 합니다. ${connectionHelp}`);
  }
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(endpoint.protocol)) {
    throw new TypeError('CDP endpoint는 HTTP 또는 WebSocket URL이어야 합니다.');
  }
  return endpoint;
}

export function readLighthouseConnection(environment = process.env) {
  const endpoint = readBrowserEndpoint(environment);
  if (endpoint.protocol !== 'http:' || !endpoint.port ||
      endpoint.pathname !== '/' || endpoint.search || endpoint.hash ||
      endpoint.username || endpoint.password) {
    throw new TypeError('Lighthouse 감사에는 기존 브라우저의 포트가 명시된 HTTP CDP endpoint가 필요합니다.');
  }
  return { hostname: endpoint.hostname.replace(/^\[|\]$/g, ''), port: Number(endpoint.port) };
}

/** 기존 브라우저에 연결하고 이 검증에서 만든 context만 정리합니다. */
export async function connectBrowserForVerification({ environment = process.env, connect } = {}) {
  const endpoint = readBrowserEndpoint(environment);
  const connector = connect ?? (async (url, options) => {
    const { chromium } = await import('playwright');
    return chromium.connectOverCDP(url, options);
  });
  const browser = await connector(endpoint.href, { timeout: 10000 });
  const contexts = new Set();

  const close = async () => {
    const results = await Promise.allSettled([...contexts].map((context) => context.close()));
    // connectOverCDP의 close는 외부 브라우저를 종료하지 않고 연결만 해제합니다.
    await browser.close();
    const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason);
    if (errors.length) throw new AggregateError(errors, '검증용 browser context를 정리하지 못했습니다.');
  };
  const newContext = async (options) => {
    try {
      const context = await browser.newContext(options);
      contexts.add(context);
      return context;
    } catch (error) {
      await close();
      throw error;
    }
  };
  const newPage = async (options) => {
    const context = await newContext(options);
    try {
      return await context.newPage();
    } catch (error) {
      await close();
      throw error;
    }
  };
  return { newContext, newPage, close };
}
