import { describe, expect, it } from 'vitest';
import { harness, receivedHeaders } from './helpers/core-api-http';
import { createApiResponseObserver } from '../src/playgrounds/core/model/api-response-observation';

describe('Core API response observation', () => {
  it.each([false, 0, '', null, [], {}, { resultCode: 'STATUS_0', resultData: [] }])(
    'preserves the original response and JSON value %j',
    async (body) => {
      const observer = createApiResponseObserver();
      const response = Response.json(body);
      await observer.middleware[0]?.onResponse({
        response,
        request: new Request('http://localhost/response'),
      });
      expect(observer.read()).toEqual({ status: 200, body: { kind: 'json', value: body } });
      await expect(response.json()).resolves.toEqual(body);
      observer.reset();
      expect(observer.read()).toBeUndefined();
    },
  );

  it('captures the same HTTP 200 STATUS_0 body before the installed Core hook rejects', async () => {
    const { api, client } = harness({ isErrorMessageEnabled: false });
    const observer = createApiResponseObserver();
    const body = { resultCode: 'STATUS_0', resultMessage: 'Operation rejected', resultData: [] };
    await expect(
      client.fetchQuery(
        api.queryOptions('get', '/response', {
          params: { query: { body: JSON.stringify(body) } },
          middleware: observer.middleware,
        }),
      ),
    ).rejects.toMatchObject({ message: body.resultMessage });
    expect(observer.read()).toEqual({ status: 200, body: { kind: 'json', value: body } });
    expect(receivedHeaders).toHaveLength(1);
  });

  it('keeps non-JSON HTTP errors as text and does not fabricate a JSON body', async () => {
    const observer = createApiResponseObserver();
    await observer.middleware[0]?.onResponse({
      response: new Response('Not found', { status: 404 }),
      request: new Request('http://localhost/missing'),
    });
    expect(observer.read()).toEqual({ status: 404, body: { kind: 'text', value: 'Not found' } });
  });

  it('observes repeated cached query keys with the observer retained by the example', async () => {
    const first = harness({ isErrorMessageEnabled: false });
    const second = harness({ isErrorMessageEnabled: false });
    const observer = createApiResponseObserver();
    const body = { resultCode: 'STATUS_0', resultMessage: 'Operation rejected' };
    for (const api of [first.api, second.api]) {
      observer.reset();
      await expect(
        first.client.fetchQuery(
          api.queryOptions('get', '/response', {
            params: { query: { body: JSON.stringify(body) } },
            middleware: observer.middleware,
          }),
        ),
      ).rejects.toMatchObject({ message: body.resultMessage });
      expect(observer.read()?.body).toEqual({ kind: 'json', value: body });
    }
    expect(receivedHeaders).toHaveLength(2);
  });

  it('does not publish a response from an aborted request', async () => {
    const observer = createApiResponseObserver();
    const controller = new AbortController();
    controller.abort();
    await observer.middleware[0]?.onResponse({
      response: Response.json({ resultCode: 'STATUS_1' }),
      request: new Request('http://localhost/response', { signal: controller.signal }),
    });
    expect(observer.read()).toBeUndefined();
  });
});
