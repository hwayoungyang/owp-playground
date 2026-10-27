import { describe, expect, it } from 'vitest';
import {
  harness,
  receivedHeaders,
  renderApiHook,
  snackbars,
  unknownResultMessage,
} from './helpers/core-api-http';

describe('installed Core response modes over HTTP', () => {
  it.each([undefined, false, true])(
    'applies missing-code allowance to queries: %s',
    async (allowMissingResultCode) => {
      // Given
      const { api, client } = harness();
      const query = renderApiHook(client, () =>
        api.useApiQuery(
          'get',
          '/response',
          {
            params: { query: { body: '{"resultData":[],"total":0}' } },
          },
          { allowMissingResultCode },
        ),
      );
      // When
      const result = query.refetch({ throwOnError: true });
      // Then
      if (allowMissingResultCode)
        await expect(result).resolves.toMatchObject({ data: { resultData: [], total: 0 } });
      else await expect(result).rejects.toMatchObject({ message: unknownResultMessage });
      expect(snackbars).toHaveLength(allowMissingResultCode ? 0 : 1);
      expect(receivedHeaders[0]).not.toContain('x-owp-allow-missing-result-code');
    },
  );

  it.each([{}, { resultData: [] }])(
    'returns the whole missing-code object in queryOptions and mutation: %j',
    async (body) => {
      // Given
      const { api, client, mutation } = harness();
      const options = api.queryOptions(
        'get',
        '/response',
        { params: { query: { body: JSON.stringify(body) } } },
        {
          allowMissingResultCode: true,
        },
      );
      // When
      const results = await Promise.all([
        client.fetchQuery(options),
        mutation(JSON.stringify(body), { allowMissingResultCode: true })(),
      ]);
      // Then
      expect(results).toEqual([body, body]);
      expect(snackbars).toEqual([]);
    },
  );

  it.each([
    'null',
    'false',
    '0',
    '""',
    '[]',
    '{"resultCode":null}',
    '{"resultCode":""}',
    '{"resultCode":"UNKNOWN"}',
    'invalid JSON',
    '',
  ])('retains query success checks with missing-code allowance: %s', async (body) => {
    // Given
    const { api, client } = harness({ isErrorMessageEnabled: false });
    // When
    const result = client.fetchQuery(
      api.queryOptions(
        'get',
        '/response',
        { params: { query: { body } } },
        { allowMissingResultCode: true },
      ),
    );
    // Then
    await expect(result).rejects.toMatchObject({ message: unknownResultMessage });
  });

  for (const body of [
    false,
    0,
    '',
    null,
    [],
    {},
    { resultCode: 'STATUS_0', resultMessage: 'Session expired', resultData: [] },
  ]) {
    it(`returns raw JSON ${JSON.stringify(body)} in query, queryOptions and mutation`, async () => {
      // Given
      const { api, client, mutation, authMessages } = harness();
      const init = { params: { query: { body: JSON.stringify(body) } } };
      const query = renderApiHook(client, () =>
        api.useApiQuery('get', '/response', init, { responseMode: 'raw' }),
      );
      // When
      const [queryResult, optionsResult, mutationResult] = await Promise.all([
        query.refetch({ throwOnError: true }),
        client.fetchQuery(api.queryOptions('get', '/response', init, { responseMode: 'raw' })),
        mutation(
          JSON.stringify(body),
          { responseMode: 'raw', isServerMessageEnabled: true },
          { method: 'post' },
        )(),
      ]);
      // Then
      expect([queryResult.data, optionsResult, mutationResult]).toEqual([body, body, body]);
      expect(authMessages).toEqual([]);
      expect(snackbars).toEqual([]);
      expect(receivedHeaders.every((headers) => !headers.includes('x-owp-raw-response'))).toBe(
        true,
      );
    });
  }

  it.each([200, 204])('normalizes empty HTTP %s bodies to null in raw mode', async (status) => {
    // Given
    const { api, client, mutation } = harness();
    // When
    const results = await Promise.all([
      client.fetchQuery(
        api.queryOptions(
          'get',
          '/response',
          { params: { query: { body: '', status } } },
          { responseMode: 'raw' },
        ),
      ),
      mutation('', { responseMode: 'raw' }, { status })(),
    ]);
    // Then
    expect(results).toEqual([null, null]);
    expect(snackbars).toEqual([]);
  });

  it.each(['owp', 'raw'] as const)(
    'applies POST success guidance for response mode %s',
    async (responseMode) => {
      // Given
      const { mutation } = harness();
      const body = { resultCode: 'STATUS_1', resultMessage: 'Saved', resultData: [] };
      // When
      const result = await mutation(
        JSON.stringify(body),
        { responseMode, isServerMessageEnabled: true },
        { method: 'post' },
      )();
      // Then
      expect(result).toEqual(body);
      expect(snackbars).toEqual(responseMode === 'raw' ? [] : ['Saved']);
    },
  );

  it.each([undefined, false, true])(
    'ignores allowMissingResultCode=%s when reusing a raw cache',
    async (allowMissingResultCode) => {
      // Given
      const { api, client } = harness();
      const init = { params: { query: { body: 'false' } } };
      await client.fetchQuery(
        api.queryOptions('get', '/response', init, { responseMode: 'raw', staleTime: Infinity }),
      );
      // When
      const result = await client.fetchQuery(
        api.queryOptions('get', '/response', init, {
          responseMode: 'raw',
          allowMissingResultCode,
          staleTime: Infinity,
        }),
      );
      // Then
      expect(result).toBe(false);
      expect(receivedHeaders).toHaveLength(1);
      expect(snackbars).toEqual([]);
    },
  );

  it('keeps HTTP error data and automatic authentication handling in raw queries', async () => {
    // Given
    const { api, client, authMessages } = harness();
    const body = {
      resultCode: 'STATUS_0',
      resultMessage: 'Bad request',
      trace: 'Token expired',
      message: 'Unauthorized',
    };
    // When
    const result = client.fetchQuery(
      api.queryOptions(
        'get',
        '/response',
        { params: { query: { body: JSON.stringify(body), status: 400 } } },
        { responseMode: 'raw' },
      ),
    );
    // Then
    await expect(result).rejects.toMatchObject({
      status: 400,
      responseData: body,
      message: 'Bad request',
    });
    expect(authMessages).toEqual(['Token expired\nUnauthorized']);
    expect(snackbars).toEqual([]);
  });

  it.each([true, false])(
    'keeps raw HTTP mutation guidance controlled by automatic handling: %s',
    async (isServerErrorMessageEnabled) => {
      // Given
      const { mutation } = harness();
      const body = { resultCode: 'STATUS_0', resultMessage: 'Bad request' };
      // When
      const result = mutation(
        JSON.stringify(body),
        { responseMode: 'raw', isServerErrorMessageEnabled },
        { status: 400 },
      )();
      // Then
      await expect(result).rejects.toMatchObject({
        status: 400,
        responseData: body,
        message: body.resultMessage,
      });
      expect(snackbars).toEqual(isServerErrorMessageEnabled ? [body.resultMessage] : []);
    },
  );
});
