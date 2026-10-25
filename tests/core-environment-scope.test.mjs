import { STORAGE_KEYS } from '@owp/core/constants';
import { act, createElement, StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { CoreEnvironmentScope } from '../src/playgrounds/core/runtime/CoreEnvironmentScope';

function createNullHost(storage) {
  const document = {
    nodeType: 9,
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
  };
  const window = {
    document,
    localStorage: storage,
    HTMLIFrameElement: class {},
    addEventListener() {},
    removeEventListener() {},
    event: undefined,
  };
  document.defaultView = window;
  vi.stubGlobal('window', window);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return {
    nodeType: 1,
    tagName: 'DIV',
    nodeName: 'DIV',
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    ownerDocument: document,
    addEventListener() {},
    removeEventListener() {},
    textContent: '',
  };
}

// 설치본 OwpAppProvider와 같은 layout-effect 시점에 환경을 기록합니다. DOM은 렌더링하지 않습니다.
function EnvironmentWriter({ value, storage }) {
  useLayoutEffect(() => {
    storage.setItem(STORAGE_KEYS.owpEnv, value);
  }, [storage, value]);
  return null;
}

describe.each([false, true])('Core environment React lifecycle (StrictMode=%s)', (strict) => {
  it.each([null, '{ "apiBaseUrl": "/original", "preserve": true }'])(
    'restores the original raw value %s after keyed sample switches and reset',
    async (original) => {
      const values = new Map(original === null ? [] : [[STORAGE_KEYS.owpEnv, original]]);
      const storage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
      };
      const root = createRoot(createNullHost(storage));
      const renderSample = async (key, value) => {
        const scope = createElement(
          CoreEnvironmentScope,
          null,
          createElement(EnvironmentWriter, { key, value, storage }),
        );
        await act(async () => root.render(strict ? createElement(StrictMode, null, scope) : scope));
        expect(storage.getItem(STORAGE_KEYS.owpEnv)).toBe(value);
      };
      try {
        await renderSample('sample-a', 'A');
        await renderSample('sample-b', 'B');
        await renderSample('sample-b-reset', 'B-reset');
        await act(async () => root.render(null));
        expect(storage.getItem(STORAGE_KEYS.owpEnv)).toBe(original);
      } finally {
        await act(async () => root.unmount());
        vi.unstubAllGlobals();
      }
    },
  );
});
