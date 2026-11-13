import rowsUrl from '../data/processes.json?url&no-inline';
import emptyUrl from '../data/processes-empty.json?url&no-inline';
import errorUrl from '../data/processes-error.json?url&no-inline';
import missingCodeUrl from '../data/processes-no-code.json?url&no-inline';
import nullCodeUrl from '../data/processes-null-code.json?url&no-inline';
import arrayUrl from '../data/processes-array.json?url&no-inline';
import authUrl from '../data/processes-auth-error.json?url&no-inline';
import authResponse from '../data/processes-auth-error.json';
import invalidDataResponse from '../data/processes-invalid-data.json';
import { queryFixtures as processFixtures } from './fixtures';
import rawObjectUrl from '../data/api-raw-object.json?url&no-inline';
import rawArrayUrl from '../data/api-raw-array.json?url&no-inline';
import rawEmptyObjectUrl from '../data/api-raw-empty-object.json?url&no-inline';
import rawFalseUrl from '../data/api-raw-false.json?url&no-inline';
import rawZeroUrl from '../data/api-raw-zero.json?url&no-inline';
import rawEmptyStringUrl from '../data/api-raw-empty-string.json?url&no-inline';
import rawNullUrl from '../data/api-raw-null.json?url&no-inline';
import type { ApiResponseObservation } from './api-response-observation';

export const owpEndpoints = {
  '조회 결과 있음': rowsUrl,
  '조회 결과 없음': emptyUrl,
  '업무 오류 (STATUS_0)': errorUrl,
  'resultCode 없음': missingCodeUrl,
  'resultCode가 null': nullCodeUrl,
  '배열 응답': arrayUrl,
  '인증 오류 응답': authUrl,
  'HTTP 404': '/core-api-unavailable.json',
} as const;
export const rawEndpoints = {
  'JSON 객체': rawObjectUrl,
  'JSON 배열': rawArrayUrl,
  '빈 객체 {}': rawEmptyObjectUrl,
  false: rawFalseUrl,
  '0': rawZeroUrl,
  '빈 문자열 ""': rawEmptyStringUrl,
  null: rawNullUrl,
  'HTTP 404': '/core-api-unavailable.json',
} as const;
export const owpResponseTypes = [
  '조회 결과 있음',
  '조회 결과 없음',
  '업무 오류 (STATUS_0)',
  'resultCode 없음',
  'resultCode가 null',
  '배열 응답',
  '인증 오류 응답',
  'HTTP 404',
] as const;
export const rawResponseTypes = [
  'JSON 객체',
  'JSON 배열',
  '빈 객체 {}',
  'false',
  '0',
  '빈 문자열 ""',
  'null',
  'HTTP 404',
] as const;
export const queryPolicies = ['기본 검사', 'resultCode 누락 허용'] as const;
export const mutationPolicies = [...queryPolicies, '호출부 직접 판정'] as const;
export const requestModes = ['Query', 'Mutation (GET)'] as const;
export const responseModes = ['owp', 'raw'] as const;
export const queryFixtures = [
  '선택한 응답',
  '정상 응답',
  '빈 목록 1회 후 정상',
  '잘못된 resultData 1회 후 정상',
  '연속 검증 실패',
  '인증 오류 응답',
  'AbortError 발생',
] as const;
export type ApiQueryFixture = (typeof queryFixtures)[number];

export function queryFixtureBody(
  fixture: ApiQueryFixture,
  attempt: number,
): ApiJsonBody | undefined {
  switch (fixture) {
    case '선택한 응답':
    case 'AbortError 발생':
      return undefined;
    case '정상 응답':
      return processFixtures.rows;
    case '빈 목록 1회 후 정상':
      return attempt === 1 ? processFixtures.empty : processFixtures.rows;
    case '잘못된 resultData 1회 후 정상':
      return attempt === 1 ? invalidDataResponse : processFixtures.rows;
    case '연속 검증 실패':
      return processFixtures.empty;
    case '인증 오류 응답':
      return authResponse;
    default: {
      const exhaustive: never = fixture;
      return exhaustive;
    }
  }
}
export const requestInit = { headers: { Accept: 'application/json' }, parseAs: 'json' } as const;

export type ApiJsonBody =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: ApiJsonBody }
  | readonly ApiJsonBody[];
export type ApiPaths = Record<
  string,
  {
    readonly get: {
      readonly responses: {
        readonly 200: { readonly content: { readonly 'application/json': ApiJsonBody } };
      };
    };
  }
>;
export type ApiRequestOptions = {
  readonly endpoint: string;
  readonly mode: (typeof requestModes)[number];
  readonly responseMode: (typeof responseModes)[number];
  readonly policy: (typeof mutationPolicies)[number];
  readonly guidance: boolean;
};
export type ApiOutcome =
  | { readonly kind: 'idle' }
  | { readonly kind: 'pending' }
  | { readonly kind: 'cancelled' }
  | {
      readonly kind: 'success';
      readonly data: ApiJsonBody;
      readonly response?: ApiResponseObservation;
    }
  | {
      readonly kind: 'error';
      readonly message: string;
      readonly response?: ApiResponseObservation;
    };

export type ApiQueryState = {
  readonly status: string;
  readonly fetchStatus: string;
  readonly failureCount: number;
  readonly attempts: number;
  readonly error: string | undefined;
  readonly failureReason: string | undefined;
  readonly data: ApiJsonBody | undefined;
};

export const responseGuidance = {
  raw: 'raw는 HTTP 성공 시 JSON body 전체를 반환합니다. 업무 코드·인증 응답 판정과 성공 알림은 생략하고 HTTP·네트워크 오류와 오류 알림 설정은 유지합니다.',
  '기본 검사': '기본 모드는 HTTP 성공과 STATUS_1을 함께 확인합니다.',
  'resultCode 누락 허용':
    'HTTP 성공 객체에 resultCode 필드가 없을 때만 허용합니다. null과 실패 코드, 배열은 허용하지 않습니다.',
  '호출부 직접 판정':
    '수동 모드의 요청 완료는 업무 성공을 뜻하지 않습니다. resultCode와 인증 오류를 호출부에서 확인해야 합니다.',
} as const;
