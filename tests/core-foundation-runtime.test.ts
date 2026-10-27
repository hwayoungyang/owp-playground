import { createRequire } from 'node:module';
import type { QueryClient as OwpQueryClient } from '@tanstack/react-query';
import { afterAll, expect, it, vi } from 'vitest';

const coreRequire = createRequire(import.meta.resolve('@owp/core'));
// 알림 라이브러리는 Node 모드로 읽고 Core의 URL 설정 조회에 필요한 location만 제공합니다.
await import(coreRequire.resolve('notistack'));
vi.stubGlobal('window', { location: { search: '' } });
afterAll(() => vi.unstubAllGlobals());

const {
  changeOwpThemeAtom,
  createOwpStore,
  createOwpStoreState,
  currentSettingsAtom,
  defaultSettingsAtom,
  resetSettingsAtom,
  setSettingsAtom,
} = await import('@owp/core/store');
const { itemsQueryKey, queryOptions } = await import('../src/playgrounds/core/guides/api-setup');
const { QueryClient }: { readonly QueryClient: new () => OwpQueryClient } = await import(
  coreRequire.resolve('@tanstack/react-query')
);

it('invalidates the populated list cache with the key used after a successful save', async () => {
  const client = new QueryClient();
  const listKey = queryOptions('get', '/items', {}).queryKey;
  client.setQueryData(listKey, { resultCode: 'STATUS_1', resultData: [] });
  try {
    await client.invalidateQueries({ queryKey: itemsQueryKey });
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
  } finally {
    client.clear();
  }
});

it('adopts current non-theme settings as defaults when changing an OWP theme in Core 10.2.0', () => {
  const store = createOwpStore(createOwpStoreState({ customScrollbars: true }));
  store.set(setSettingsAtom, { ...store.get(currentSettingsAtom), customScrollbars: false });
  expect(store.get(defaultSettingsAtom).customScrollbars).toBe(true);

  store.set(changeOwpThemeAtom, store.get(currentSettingsAtom).theme);
  store.set(resetSettingsAtom);

  expect(store.get(defaultSettingsAtom).customScrollbars).toBe(false);
  expect(store.get(currentSettingsAtom).customScrollbars).toBe(false);
});
