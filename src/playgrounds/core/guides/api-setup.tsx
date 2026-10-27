import { createOwpApiHooks } from '@owp/core/hooks';
import { useQueryClient } from '@tanstack/react-query';

type Item = { readonly id: string; readonly name: string };
type ItemResponse = {
  readonly resultCode: string;
  readonly resultMessage: string;
  readonly resultData: Item[];
};
type JsonResponse = { readonly content: { readonly 'application/json': ItemResponse } };

// 실제 앱에서는 서버 OpenAPI에서 생성한 paths 타입으로 교체합니다.
type Paths = {
  readonly '/connection': {
    readonly get: {
      readonly responses: {
        readonly 200: {
          readonly content: { readonly 'application/json': { readonly ipAddress: string } };
        };
      };
    };
  };
  readonly '/items': {
    readonly get: { readonly responses: { readonly 200: JsonResponse } };
    readonly post: {
      readonly requestBody: {
        readonly content: { readonly 'application/json': { readonly name: string } };
      };
      readonly responses: { readonly 200: JsonResponse };
    };
  };
};

// Provider의 env와 API 접속 주소·token 전송 방식을 맞춥니다.
export const { useApiQuery, useApiSuspenseQuery, useApiMutation, queryOptions } =
  createOwpApiHooks<Paths>({
    baseUrl: '/api',
    accessTokenTransport: 'bearer',
    isI18nEnabled: false,
    successResultCode: 'STATUS_1',
    isErrorMessageEnabled: true,
    authErrors: ['AUTH_EXPIRED'],
    onAuthError: () => window.location.assign('/login'),
  });

// 생성한 queryKey를 그대로 재사용합니다. prefix 무효화는 같은 init의 응답 정책도 포함합니다.
export const itemsQueryKey = queryOptions('get', '/items', {}).queryKey;

export function useItems() {
  const queryClient = useQueryClient();
  const query = useApiQuery('get', '/items', {}, { staleTime: 30_000 });
  const save = useApiMutation('post', '/items', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryKey }),
  });

  function createItem(name: string) {
    save.mutate({ body: { name } });
  }

  return { query, save, items: query.data?.resultData ?? [], createItem };
}

// 요청별 options에 지정합니다. {}와 { resultData: [] }도 전체 객체로 반환합니다.
export const connectionQueryOptions = queryOptions(
  'get',
  '/connection',
  {},
  {
    allowMissingResultCode: true,
    staleTime: 30_000,
  },
);

export function useConnection() {
  return useApiQuery('get', '/connection', {}, { allowMissingResultCode: true });
}

// 상위에 Suspense와 오류 경계를 배치합니다.
export function useSuspenseConnection() {
  return useApiSuspenseQuery('get', '/connection', {}, { allowMissingResultCode: true });
}

export function useConnectionMutation() {
  return useApiMutation('get', '/connection', {
    allowMissingResultCode: true,
    isServerMessageEnabled: false,
  });
}

// raw는 파싱한 JSON body 전체를 반환합니다. parseAs는 생략하거나 'json'만 사용합니다.
export const rawItemsQueryOptions = queryOptions(
  'get',
  '/items',
  { parseAs: 'json' },
  {
    responseMode: 'raw',
  },
);

export function useRawItems() {
  return useApiQuery<ItemResponse>(
    'get',
    '/items',
    { parseAs: 'json' },
    {
      responseMode: 'raw',
    },
  );
}

export function useRawSuspenseItems() {
  return useApiSuspenseQuery<ItemResponse>(
    'get',
    '/items',
    { parseAs: 'json' },
    { responseMode: 'raw' },
  );
}

export function useRawSave() {
  // HTTP 2xx의 업무 코드·인증 검사와 성공 snackbar를 생략하므로 필요한 판정은 앱이 합니다.
  const save = useApiMutation('post', '/items', { responseMode: 'raw' });

  function createItem(name: string) {
    return save.mutateAsync({ body: { name }, parseAs: 'json' });
  }

  return { save, createItem };
}

// 서버 판정을 직접 맡는 경우 onSuccess에서도 업무 성공과 인증 오류를 확인합니다.
export function useManualSave({
  onSaved,
  onServerError,
}: {
  readonly onSaved: (response: ItemResponse) => void;
  readonly onServerError: (message: string) => void;
}) {
  const save = useApiMutation('post', '/items', {
    isServerErrorMessageEnabled: false,
    isServerMessageEnabled: false,
    onSuccess: (response) => {
      if (response.resultCode === 'STATUS_1') {
        onSaved(response);
      } else if (response.resultMessage.includes('AUTH_EXPIRED')) {
        window.location.assign('/login');
      } else {
        onServerError(response.resultMessage);
      }
    },
  });

  function createItem(name: string, signal?: AbortSignal) {
    // HTTP·연결 실패는 reject합니다. 호출부의 try/catch에서 Error를 처리합니다.
    return save.mutateAsync({ body: { name }, signal });
  }

  return { save, createItem };
}
