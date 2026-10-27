import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import type { CreateOwpApiHooksOptions, OwpApiMutationBehaviorOptions } from '@owp/core/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const coreRequire = createRequire(import.meta.resolve('@owp/core'));
export const snackbars: string[] = [];
vi.doMock(coreRequire.resolve('notistack'), () => ({
  enqueueSnackbar: (message: string) => {
    snackbars.push(message);
  },
}));
const storedValues = new Map<string, string>();
const storage = {
  getItem: (key: string) => storedValues.get(key) ?? null,
  setItem: (key: string, value: string) => storedValues.set(key, value),
  removeItem: (key: string) => storedValues.delete(key),
};
vi.stubGlobal('window', {
  localStorage: storage,
  sessionStorage: storage,
  location: { search: '', pathname: '/', href: 'http://localhost/' },
});
const { createOwpApiHooks } = await import('@owp/core/hooks');

type Operation = {
  readonly responses: {
    readonly 200: {
      readonly content: { readonly 'application/json': unknown };
    };
  };
};
type Paths = Record<string, { readonly get: Operation; readonly post: Operation }>;
export const unknownResultMessage = '처리 결과를 확인할 수 없습니다. 내용을 다시 조회해주세요.';
export const fetchFailureMessage =
  '요청을 완료하지 못했습니다. 연결 상태와 처리 결과를 확인해 주세요.';
export const receivedHeaders: string[][] = [];
const server = createServer((request, response) => {
  receivedHeaders.push(Object.keys(request.headers));
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname === '/disconnect') {
    request.socket.destroy();
    return;
  }
  if (url.pathname === '/pending') return;
  response.writeHead(Number(url.searchParams.get('status') ?? '200'), {
    'content-type': 'application/json',
  });
  response.end(url.searchParams.get('body') ?? '{"resultCode":"STATUS_1"}');
});
let baseUrl = '';
const clients: QueryClient[] = [];
beforeAll(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new TypeError('Expected HTTP server address');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
beforeEach(() => {
  snackbars.length = 0;
  receivedHeaders.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterAll(async () => {
  for (const client of clients) client.clear();
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

export function harness(factoryOptions: Partial<CreateOwpApiHooksOptions> = {}) {
  const authMessages: string[] = [];
  const api = createOwpApiHooks<Paths>({
    baseUrl,
    getAccessToken: () => '',
    isI18nEnabled: false,
    successResultCode: 'STATUS_1',
    authErrors: ['expired'],
    onAuthError: (message) => authMessages.push(message),
    ...factoryOptions,
  });
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  function mutation(
    body: string,
    options: OwpApiMutationBehaviorOptions = {},
    request: {
      readonly status?: number;
      readonly path?: string;
      readonly fetch?: typeof fetch;
      readonly method?: 'get' | 'post';
    } = {},
  ) {
    let run: ((signal?: AbortSignal) => Promise<unknown>) | undefined;
    function Reader() {
      const value = api.useApiMutation(request.method ?? 'get', request.path ?? '/response', {
        isServerMessageEnabled: false,
        ...options,
        responseMode: options.responseMode ?? 'owp',
      });
      run = (signal) =>
        value.mutateAsync({
          params: { query: { body, status: request.status ?? 200 } },
          signal,
          ...(request.fetch ? { fetch: request.fetch } : {}),
        });
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Reader />
      </QueryClientProvider>,
    );
    if (!run) throw new TypeError('Mutation hook was not rendered');
    return run;
  }
  return { api, client, authMessages, mutation };
}

export function renderApiHook<Result>(client: QueryClient, useRead: () => Result): Result {
  let result: { readonly value: Result } | undefined;
  function Reader() {
    // oxlint-disable-next-line react/globals -- SSR 검증은 Effect 없이 hook 반환값만 캡처합니다.
    result = { value: useRead() };
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Reader />
    </QueryClientProvider>,
  );
  if (!result) throw new TypeError('API hook was not rendered');
  return result.value;
}

export function nextHttpRequest() {
  return once(server, 'request');
}
