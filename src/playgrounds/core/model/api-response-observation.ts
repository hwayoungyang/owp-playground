import { z } from 'zod';
import type { ApiJsonBody } from './api-response';

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

/** 같은 응답을 복사해 관찰하며 Core의 응답 판정에는 관여하지 않습니다. */
export function createApiResponseObserver() {
  let observation: ApiResponseObservation | undefined;
  return {
    reset: () => {
      observation = undefined;
    },
    read: () => observation,
    middleware: [
      {
        async onResponse({
          response,
          request,
        }: {
          readonly response: Response;
          readonly request: Request;
        }) {
          try {
            const text = await response.clone().text();
            if (!request.signal.aborted)
              observation = { status: response.status, body: parseBody(text) };
          } catch (error) {
            if (!(error instanceof Error)) throw error;
            // 본문 관찰에 실패해도 원래 요청의 응답 처리는 계속합니다.
            if (!request.signal.aborted) observation = { status: response.status };
          }
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
