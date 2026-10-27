import { describe, expect, it } from 'vitest';
import {
  harness,
  snackbars,
  receivedHeaders,
  unknownResultMessage,
  fetchFailureMessage,
} from './helpers/core-api-http';

describe('installed Core API error policies over HTTP', () => {
  it.each([undefined, false, true])(
    'allows a missing own resultCode only when mutation opt-in is %s',
    async (allowMissingResultCode) => {
      // Given
      const view = harness();
      const run = view.mutation('{"ipAddress":"127.0.0.1"}', { allowMissingResultCode });
      // When
      const result = run();
      // Then
      if (allowMissingResultCode) await expect(result).resolves.toEqual({ ipAddress: '127.0.0.1' });
      else await expect(result).rejects.toMatchObject({ message: unknownResultMessage });
      expect(snackbars).toHaveLength(allowMissingResultCode ? 0 : 1);
      expect(receivedHeaders[0]).not.toContain('x-owp-allow-missing-result-code');
    },
  );

  it.each([
    '{"resultCode":null}',
    '{"resultCode":""}',
    '{"resultCode":"UNKNOWN"}',
    '{"resultCode":1}',
    '[]',
    '[{"ipAddress":"127.0.0.1"}]',
    'null',
    '42',
    'true',
    '"primitive"',
    'invalid JSON',
    '',
  ])('rejects unsupported or explicit resultCode bodies with allowance: %s', async (body) => {
    // Given
    const run = harness().mutation(body, { allowMissingResultCode: true });
    // When / Then
    await expect(run()).rejects.toMatchObject({ message: unknownResultMessage });
  });

  it('keeps query success checks strict for a code-less object', async () => {
    // Given
    const { client, api } = harness({ isErrorMessageEnabled: false });
    // When
    const result = client.fetchQuery(
      api.queryOptions('get', '/response', {
        params: { query: { body: '{"ipAddress":"127.0.0.1"}' } },
      }),
    );
    // Then
    await expect(result).rejects.toMatchObject({ message: unknownResultMessage });
    expect(snackbars).toEqual([]);
  });

  it.each([true, false])(
    'preserves STATUS_0 whitespace with common messages %s',
    async (isErrorMessageEnabled) => {
      // Given
      const view = harness({ isErrorMessageEnabled });
      const message = '  Original error\nDetails  ';
      const run = view.mutation(
        JSON.stringify({ resultCode: 'STATUS_0', resultMessage: message }),
        { allowMissingResultCode: true },
      );
      // When / Then
      await expect(run()).rejects.toMatchObject({ message });
      expect(snackbars).toEqual(isErrorMessageEnabled ? [message] : []);
    },
  );

  it.each([true, false])(
    'keeps automatic authentication handling with common messages %s',
    async (isErrorMessageEnabled) => {
      // Given
      const view = harness({ isErrorMessageEnabled });
      const run = view.mutation('{"resultCode":"UNKNOWN","resultMessage":"Session expired"}', {
        allowMissingResultCode: true,
      });
      // When / Then
      await expect(run()).rejects.toMatchObject({ message: unknownResultMessage });
      expect(view.authMessages).toEqual(['Session expired']);
      expect(snackbars).toEqual([]);
    },
  );

  it('delegates HTTP 200 result and authentication checks to manual mutations', async () => {
    // Given
    const view = harness();
    const body = { resultCode: 'STATUS_0', resultMessage: 'Session expired' };
    const run = view.mutation(JSON.stringify(body), {
      isServerErrorMessageEnabled: false,
      allowMissingResultCode: true,
    });
    // When / Then
    await expect(run()).resolves.toEqual(body);
    expect(view.authMessages).toEqual([]);
    expect(snackbars).toEqual([]);
    expect(receivedHeaders[0]).not.toContain('x-owp-server-error-message-disabled');
  });

  it.each([true, false])(
    'rejects HTTP errors and preserves display/auth messages in automatic mode %s',
    async (isServerErrorMessageEnabled) => {
      // Given
      const view = harness({ isErrorMessageEnabled: false });
      const body = {
        resultCode: 'STATUS_0',
        resultMessage: '  Server error\nDetails  ',
        trace: 'Token expired',
        message: 'Unauthorized',
      };
      const run = view.mutation(
        JSON.stringify(body),
        { isServerErrorMessageEnabled, allowMissingResultCode: true },
        { status: 500 },
      );
      // When / Then
      await expect(run()).rejects.toMatchObject({
        status: 500,
        responseData: body,
        message: body.resultMessage,
      });
      expect(view.authMessages).toEqual(
        isServerErrorMessageEnabled ? ['Token expired\nUnauthorized'] : [],
      );
    },
  );

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    'rejects connection failure and controls guidance with flags %s/%s',
    async (isErrorMessageEnabled, isServerErrorMessageEnabled) => {
      // Given
      const view = harness({ isErrorMessageEnabled });
      const run = view.mutation(
        '',
        { isServerErrorMessageEnabled, allowMissingResultCode: true },
        { path: '/disconnect' },
      );
      // When / Then
      await expect(run()).rejects.toBeInstanceOf(TypeError);
      expect(snackbars).toEqual(
        isErrorMessageEnabled && isServerErrorMessageEnabled ? [fetchFailureMessage] : [],
      );
      expect(view.authMessages).toEqual([]);
    },
  );

  it.each(['owp', 'raw'] as const)(
    'preserves an aborted request reason without guidance in %s mode',
    async (responseMode) => {
      // Given
      const view = harness();
      const controller = new AbortController();
      const reason = new TypeError('Caller canceled');
      controller.abort(reason);
      const run = view.mutation('', { allowMissingResultCode: true, responseMode });
      // When / Then
      await expect(run(controller.signal)).rejects.toBe(reason);
      expect(snackbars).toEqual([]);
      expect(view.authMessages).toEqual([]);
    },
  );

  it.each(['owp', 'raw'] as const)(
    'omits AbortError guidance with an active signal in %s mode',
    async (responseMode) => {
      // Given
      const view = harness();
      const reason = new DOMException('Request canceled by transport', 'AbortError');
      const requestFetch: typeof fetch = async () => {
        throw reason;
      };
      const controller = new AbortController();
      const run = view.mutation('', { responseMode }, { fetch: requestFetch });
      // When / Then
      await expect(run(controller.signal)).rejects.toBe(reason);
      expect(controller.signal.aborted).toBe(false);
      expect(snackbars).toEqual([]);
      expect(view.authMessages).toEqual([]);
    },
  );

  it.each(['owp', 'raw'] as const)(
    'propagates the original native fetch failure without wrapping in %s mode',
    async (responseMode) => {
      // Given
      const view = harness();
      let originalError: unknown;
      const requestFetch: typeof fetch = async (input, init) => {
        try {
          return await fetch(input, init);
        } catch (error) {
          if (!(error instanceof Error)) throw error;
          originalError = error;
          throw error;
        }
      };
      const run = view.mutation('', { responseMode }, { path: '/disconnect', fetch: requestFetch });
      // When
      const outcome = await Promise.allSettled([run()]);
      // Then
      const result = outcome[0];
      expect(result?.status).toBe('rejected');
      if (!result || result.status !== 'rejected') throw new TypeError('Expected rejected fetch');
      expect(result.reason).toBe(originalError);
      expect(originalError).toBeInstanceOf(TypeError);
      expect(snackbars).toEqual([fetchFailureMessage]);
    },
  );
});
