import { z } from 'zod';
import { queryFixtureBody } from './api-response';
import type { ApiJsonBody, ApiQueryFixture } from './api-response';

export type ApiResponseObservation = {
  readonly status: number;
  readonly body?:
    | { readonly kind: 'json'; readonly value: ApiJsonBody }
    | { readonly kind: 'text'; readonly value: string };
};

function parseBody(text: string): ApiResponseObservation['body'] {
  if (!text) return undefined;
  try {
    const value: unknown = JSON.parse(text);
    const result = z.json().safeParse(value);
    if (result.success) return { kind: 'json', value: result.data };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  return { kind: 'text', value: text };
}

/** 요청 URL을 유지한 fixture 응답을 관찰하며, 응답 판정은 Core와 Query에 맡깁니다. */
export function createApiResponseObserver() {
  let observation: ApiResponseObservation | undefined;
  let attempts = 0;
  let fixture: ApiQueryFixture = '선택한 응답';
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    reset: (nextFixture: ApiQueryFixture = '선택한 응답') => {
      observation = undefined;
      attempts = 0;
      fixture = nextFixture;
      notify();
    },
    read: () => observation,
    getSnapshot: () => attempts,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    middleware: [
      {
        onRequest({ request }: { readonly request: Request }) {
          observation = undefined;
          attempts += 1;
          notify();
          if (fixture === 'AbortError 발생') {
            const controller = new AbortController();
            controller.abort(new DOMException('AbortError fixture', 'AbortError'));
            return new Request(request, { signal: controller.signal });
          }
        },
        async onResponse({
          response,
          request,
        }: {
          readonly response: Response;
          readonly request: Request;
        }) {
          const body = queryFixtureBody(fixture, attempts);
          const observedResponse =
            response.status === 200 && body !== undefined
              ? Response.json(body, { status: response.status, statusText: response.statusText })
              : response;
          try {
            const text = await observedResponse.clone().text();
            if (!request.signal.aborted)
              observation = { status: observedResponse.status, body: parseBody(text) };
          } catch (error) {
            if (!(error instanceof Error)) throw error;
            // 본문 관찰에 실패해도 원래 요청의 응답 처리는 계속합니다.
            if (!request.signal.aborted) observation = { status: observedResponse.status };
          }
          return observedResponse;
        },
      },
    ],
  };
}

export function apiResultCode(value: ApiJsonBody) {
  return value !== null && typeof value === 'object' && 'resultCode' in value
    ? value.resultCode
    : undefined;
}
