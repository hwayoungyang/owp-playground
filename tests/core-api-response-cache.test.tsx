import { isCancelledError } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import {
  fetchFailureMessage,
  harness,
  nextHttpRequest,
  receivedHeaders,
  renderApiHook,
  snackbars,
} from './helpers/core-api-http';

describe('installed Core response policy cache', () => {
  it('isolates concurrent strict, permissive and raw queries for the same request', async () => {
    // Given
    const { api, client } = harness({ isErrorMessageEnabled: false });
    const init = { params: { query: { body: '{"resultData":[],"total":0}' } } };
    const options = [
      api.queryOptions('get', '/response', init),
      api.queryOptions('get', '/response', init, { allowMissingResultCode: true }),
      api.queryOptions('get', '/response', init, { responseMode: 'raw' }),
    ] as const;
    // When
    const results = await Promise.allSettled([
      client.fetchQuery(options[0]),
      client.fetchQuery(options[1]),
      client.fetchQuery(options[2]),
    ]);
    // Then
    expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled', 'fulfilled']);
    expect(client.getQueryCache().getAll()).toHaveLength(3);
    expect(receivedHeaders).toHaveLength(3);
    expect(client.getQueryData(options[0].queryKey)).toBeUndefined();
    expect(client.getQueryData(options[1].queryKey)).toEqual({ resultData: [], total: 0 });
    expect(client.getQueryData(options[2].queryKey)).toEqual({ resultData: [], total: 0 });
  });

  it('uses canonical keys for default, explicit OWP, allowance and raw policies', () => {
    // Given
    const { api } = harness();
    const init = { params: { query: { search: 'item' } } };
    // When
    const defaults = api.queryOptions('get', '/response', init);
    const explicit = api.queryOptions('get', '/response', init, {
      responseMode: 'owp',
      allowMissingResultCode: false,
    });
    const permissive = api.queryOptions('get', '/response', init, { allowMissingResultCode: true });
    const raw = api.queryOptions('get', '/response', init, { responseMode: 'raw' });
    const rawWithAllowance = api.queryOptions('get', '/response', init, {
      responseMode: 'raw',
      allowMissingResultCode: true,
    });
    // Then
    expect(defaults.queryKey).toEqual(['get', '/response', init]);
    expect(explicit.queryKey).toEqual(defaults.queryKey);
    expect(permissive.queryKey).toEqual([
      'get',
      '/response',
      init,
      { owpResponsePolicy: { responseMode: 'owp', allowMissingResultCode: true } },
    ]);
    expect(raw.queryKey).toEqual([
      'get',
      '/response',
      init,
      { owpResponsePolicy: { responseMode: 'raw' } },
    ]);
    expect(rawWithAllowance.queryKey).toEqual(raw.queryKey);
    expect(raw.queryKey[2]).toBe(init);
    expect(init).toEqual({ params: { query: { search: 'item' } } });
  });

  it.each([false, true])('invalidates policy variants according to exact=%s', async (exact) => {
    // Given
    const { api, client } = harness();
    const init = {};
    const options = [
      api.queryOptions('get', '/response', init),
      api.queryOptions('get', '/response', init, { allowMissingResultCode: true }),
      api.queryOptions('get', '/response', init, { responseMode: 'raw' }),
    ] as const;
    await Promise.all([
      client.fetchQuery(options[0]),
      client.fetchQuery(options[1]),
      client.fetchQuery(options[2]),
    ]);
    // When
    await client.invalidateQueries({ queryKey: options[0].queryKey, exact });
    // Then
    expect(options.map((option) => client.getQueryState(option.queryKey)?.isInvalidated)).toEqual(
      exact ? [true, false, false] : [true, true, true],
    );
  });

  it('invalidates only the selected opt-in key with exact=true', async () => {
    // Given
    const { api, client } = harness();
    const raw = api.queryOptions('get', '/response', {}, { responseMode: 'raw' });
    const permissive = api.queryOptions('get', '/response', {}, { allowMissingResultCode: true });
    await Promise.all([client.fetchQuery(raw), client.fetchQuery(permissive)]);
    // When
    await client.invalidateQueries({ queryKey: raw.queryKey, exact: true });
    // Then
    expect(client.getQueryState(raw.queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(permissive.queryKey)?.isInvalidated).toBe(false);
  });

  it.each(['raw', 'owp'] as const)(
    'shares the %s queryOptions cache with query and Suspense hooks',
    async (responseMode) => {
      // Given
      const { api, client } = harness();
      const init = { params: { query: { body: '{"resultData":[],"total":0}' } } };
      const policy = { responseMode, allowMissingResultCode: true, staleTime: Infinity };
      const options = api.queryOptions('get', '/response', init, policy);
      await client.fetchQuery(options);
      // When
      const query = renderApiHook(client, () => api.useApiQuery('get', '/response', init, policy));
      const suspense = renderApiHook(client, () =>
        api.useApiSuspenseQuery('get', '/response', init, policy),
      );
      // Then
      expect(query.data).toEqual({ resultData: [], total: 0 });
      expect(suspense.data).toEqual(query.data);
      expect(receivedHeaders).toHaveLength(1);
      expect(client.getQueryCache().getAll()).toHaveLength(1);
    },
  );

  it('recovers raw policy from the generated key when reusing a default queryFn', async () => {
    // Given
    const { api, client } = harness();
    const init = { params: { query: { body: 'false' } } };
    function policyOptions(responseMode: 'owp' | 'raw') {
      return api.queryOptions('get', '/response', init, { responseMode });
    }
    const raw = policyOptions('raw');
    const defaults = policyOptions('owp');
    // When
    const result = client.fetchQuery({ ...raw, queryFn: defaults.queryFn });
    // Then
    await expect(result).resolves.toBe(false);
    expect(snackbars).toEqual([]);
  });

  it.each([true, false])(
    'preserves native raw query failures with common guidance %s',
    async (isErrorMessageEnabled) => {
      // Given
      const { api, client } = harness({ isErrorMessageEnabled });
      let originalError: unknown;
      const requestFetch: typeof fetch = async (input, init) => {
        try {
          return await fetch(input, init);
        } catch (error) {
          originalError = error;
          throw error;
        }
      };
      // When
      const result = await Promise.allSettled([
        client.fetchQuery(
          api.queryOptions('get', '/disconnect', { fetch: requestFetch }, { responseMode: 'raw' }),
        ),
      ]);
      // Then
      const failure = result[0];
      if (!failure || failure.status !== 'rejected')
        throw new TypeError('Expected native fetch rejection');
      expect(failure.reason).toBe(originalError);
      expect(originalError).toBeInstanceOf(TypeError);
      expect(snackbars).toEqual(isErrorMessageEnabled ? [fetchFailureMessage] : []);
    },
  );

  it('preserves a caller cancellation reason in a raw query without guidance', async () => {
    // Given
    const { api, client } = harness();
    const controller = new AbortController();
    const reason = new TypeError('Caller canceled');
    controller.abort(reason);
    // When
    const result = client.fetchQuery(
      api.queryOptions('get', '/response', { signal: controller.signal }, { responseMode: 'raw' }),
    );
    // Then
    await expect(result).rejects.toBe(reason);
    expect(snackbars).toEqual([]);
  });

  it('connects QueryClient cancellation to an in-flight raw HTTP request', async () => {
    // Given
    const { api, client } = harness();
    const options = api.queryOptions('get', '/pending', {}, { responseMode: 'raw' });
    const received = nextHttpRequest();
    const outcome = Promise.allSettled([client.fetchQuery(options)]);
    await received;
    // When
    await client.cancelQueries({ queryKey: options.queryKey, exact: true });
    // Then
    const [result] = await outcome;
    if (!result || result.status !== 'rejected') throw new TypeError('Expected query cancellation');
    expect(isCancelledError(result.reason)).toBe(true);
    expect(snackbars).toEqual([]);
  });
});
