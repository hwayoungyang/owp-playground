import type {
  OwpApiListResponse,
  OwpApiMutationResponse,
  OwpApiSingleResponse,
} from '@owp/core/types';
import { expect, expectTypeOf, it } from 'vitest';
import { harness, renderApiHook } from './helpers/core-api-http';

const { createOwpApiHooks } = await import('@owp/core/hooks');
type Row = { readonly id: number; readonly name: string };
type Body = { readonly resultCode: string; readonly resultData: Row; readonly total: number };
type Operation = {
  readonly responses: {
    readonly 200: { readonly content: { readonly 'application/json': Body } };
  };
};
type Paths = { readonly '/items': { readonly get: Operation; readonly post: Operation } };

it('preserves installed legacy row generics for query and mutation hooks', () => {
  // Given
  const { client } = harness();
  const api = createOwpApiHooks<Paths>({ baseUrl: '/api', successResultCode: 'STATUS_1' });
  // When
  const values = renderApiHook(client, () => {
    const list = api.useApiQuery<Row>('get', '/items', undefined, {
      enabled: false,
      allowMissingResultCode: true,
    });
    const single = api.useApiQuery<Row, 'single'>('get', '/items', undefined, { enabled: false });
    const mutation = api.useApiMutation<Row>('post', '/items');
    return { list, single, mutation };
  });
  // Then: 이 assertion은 tsc --noEmit으로 설치된 declaration과 비교합니다.
  expectTypeOf(values.list.data).toEqualTypeOf<OwpApiListResponse<Row> | undefined>();
  expectTypeOf(values.single.data).toEqualTypeOf<OwpApiSingleResponse<Row> | undefined>();
  expectTypeOf(values.mutation.data).toEqualTypeOf<OwpApiMutationResponse<Row> | undefined>();
  expect(values.list.data).toBeUndefined();
});

it('preserves complete raw body types, nullable results and generated queryOptions keys', () => {
  // Given
  const { client } = harness();
  const api = createOwpApiHooks<Paths>({ baseUrl: '/api', successResultCode: 'STATUS_1' });
  const body: Body = { resultCode: 'STATUS_1', resultData: { id: 1, name: 'Item' }, total: 1 };
  const rawOptions = api.queryOptions<Body | undefined>(
    'get',
    '/items',
    {},
    { responseMode: 'raw' },
  );
  const schemaOptions = api.queryOptions('get', '/items');
  const permissiveOptions = api.queryOptions('get', '/items', {}, { allowMissingResultCode: true });
  client.setQueryData(rawOptions.queryKey, body);
  client.setQueryData(schemaOptions.queryKey, body);
  // When
  const values = renderApiHook(client, () => {
    const query = api.useApiQuery<Body | undefined>(
      'get',
      '/items',
      {},
      { responseMode: 'raw', enabled: false },
    );
    const suspense = api.useApiSuspenseQuery<Body | undefined>(
      'get',
      '/items',
      {},
      { responseMode: 'raw' },
    );
    const mutation = api.useApiMutation<Body | undefined>('post', '/items', {
      responseMode: 'raw',
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<Body | null>();
      },
    });
    const schema = api.useApiQuery('get', '/items', undefined, { enabled: false });
    return { query, suspense, mutation, schema };
  });
  // Then
  expectTypeOf(values.query.data).toEqualTypeOf<Body | null | undefined>();
  expectTypeOf(values.suspense.data).toEqualTypeOf<Body | null>();
  expectTypeOf(values.mutation.data).toEqualTypeOf<Body | null | undefined>();
  expectTypeOf<
    Awaited<ReturnType<typeof values.mutation.mutateAsync>>
  >().toEqualTypeOf<Body | null>();
  expectTypeOf(values.schema.data).toEqualTypeOf<Body | undefined>();
  expectTypeOf<Awaited<ReturnType<typeof rawOptions.queryFn>>>().toEqualTypeOf<Body | null>();
  expectTypeOf<Awaited<ReturnType<typeof schemaOptions.queryFn>>>().toEqualTypeOf<Body>();
  expectTypeOf<(typeof rawOptions.queryKey)['length']>().toEqualTypeOf<4>();
  expectTypeOf<(typeof schemaOptions.queryKey)['length']>().toEqualTypeOf<3>();
  expectTypeOf<(typeof permissiveOptions.queryKey)['length']>().toEqualTypeOf<4>();
  expect(values.suspense.data).toEqual(body);
});
