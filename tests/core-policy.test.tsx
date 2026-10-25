import type { PageLockLoadingProps } from '@owp/core/types';
import { STORAGE_KEYS } from '@owp/core/constants';
import i18next from 'i18next';
import { createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '../src/app/i18n';
import { coreCatalog, findCoreEntry } from '../src/playgrounds/core/catalog';
import {
  CoreRouteLoaderError,
  coreDemoStorage,
  createCorePolicyRoutes,
  createCoreProviderEnv,
  POLICY_ROUTER_EXAMPLES,
  readStoredOwpEnvSnapshot,
  resolveCoreProviderMode,
  restoreStoredOwpEnvSnapshot,
  runFailedPageLockTask,
  startBoundedPageLockTask,
  summarizeStoredEnv,
  usesCorePolicyRouter,
} from '../src/playgrounds/core/model/policy';

describe('Core 8.1.0 & Components 3.1.1 policy contracts', () => {
  it('handles a browser that denies access to the storage object itself', () => {
    // Given
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new DOMException('Storage disabled', 'SecurityError');
      },
    });
    try {
      // When
      const storage = coreDemoStorage();
      // Then
      expect(readStoredOwpEnvSnapshot(storage, STORAGE_KEYS.owpEnv)).toEqual({ available: false });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('scopes Data Router mode strictly to policy examples and declares qualified catalog APIs', () => {
    // Given
    const expectedRouterIds = ['loading', 'error-boundary', 'page-carded'];

    // When
    const matchedIds = coreCatalog
      .filter((entry) => usesCorePolicyRouter(entry.id))
      .map((entry) => entry.id);

    // Then
    expect(POLICY_ROUTER_EXAMPLES).toEqual(['page-carded', 'loading', 'error-boundary']);
    expect(matchedIds).toEqual(expectedRouterIds);
    expect(resolveCoreProviderMode('page-carded')).toBe('policy');
    expect(resolveCoreProviderMode('app-settings')).toBe('standalone');
    expect(resolveCoreProviderMode('page-carded', 'standalone')).toBe('standalone');
    expect(findCoreEntry('getting-started').api).toEqual([
      'OwpCoreProvider',
      'OwpStyleProvider',
      'OwpUiProvider',
      'useInitApp',
      'usePageCardedPolicy',
      'errorBoundaryPolicy',
      '@owp/components:OwpPageCarded',
      '@owp/components:OwpErrorBoundary',
      'OwpRouteErrorElement',
      '@owp/components:OwpTable',
    ]);
    expect(findCoreEntry('app-settings').api).toEqual([
      'OwpCoreProvider',
      'OwpTable',
      'OwpFieldTable',
      'useGetCurrentSettings',
      'useGetDefaultSettings',
      'useSetSettings',
      'useChangeOwpTheme',
      'useResetSettings',
      'useStorage',
    ]);
    expect(findCoreEntry('dialog').api).toEqual([
      'useOwpDialogs',
      'useDialogPolicy',
      '@owp/components:OwpDialog',
      '@owp/components:OwpFieldTable',
    ]);
    expect(findCoreEntry('loading').api).toEqual([
      '@owp/components:OwpLoading',
      'usePageLockLoading',
      'useGetPageLockLoading',
    ]);
    expect(findCoreEntry('page-carded').api).toEqual([
      '@owp/components:OwpPageCarded',
      'usePageCardedPolicy',
      'OwpUiProvider',
      'usePageLeaveGuard',
      '@owp/components:OwpPageContent',
      'OwpCoreResponsiveLayoutGlobalStyles',
      'OwpSearchFilter',
      '@owp/components:OwpTable',
    ]);
    expect(findCoreEntry('error-boundary').api).toEqual([
      '@owp/components:OwpErrorBoundary',
      'errorBoundaryPolicy',
      'OwpRouteErrorElement',
    ]);
  });

  it('configures empty apiBaseUrl in policy mode to prevent unsolicited backend fetches while keeping standalone origin', () => {
    // Given
    const origin = 'https://playground.example.test';

    // When
    const policyEnv = createCoreProviderEnv('policy', origin);
    const standaloneEnv = createCoreProviderEnv('standalone', origin);

    // Then
    expect(policyEnv).toEqual({
      apiBaseUrl: '',
      isAutoLogoutEnabled: false,
      isAccessTokenGuardEnabled: false,
      isI18nEnabled: false,
      isI18nLanguageSwitcherEnabled: true,
      isErrorMessageEnabled: false,
    });
    expect(standaloneEnv).toEqual({
      apiBaseUrl: origin,
      isAutoLogoutEnabled: false,
      isAccessTokenGuardEnabled: false,
      isI18nEnabled: true,
      isI18nLanguageSwitcherEnabled: true,
      isErrorMessageEnabled: false,
    });
  });

  it('navigates Data Router routes and surfaces localized loader errors on /route-error without recreating the router', async () => {
    // Given
    const router = createMemoryRouter(
      createCorePolicyRoutes({
        rootElement: null,
        normalElement: null,
        errorElement: null,
        getRouteErrorMessage: () =>
          i18next.t(
            '라우트 loader에서 데이터를 불러오지 못해 OwpRouteErrorElement로 전환했습니다.',
            { ns: 'app' },
          ),
      }),
      { initialEntries: ['/list'] },
    );

    // When / Then: initial and normal route navigation
    expect(router.state.location.pathname).toBe('/list');
    expect(router.state.errors).toBeNull();
    await router.navigate('/detail');
    expect(router.state.location.pathname).toBe('/detail');
    expect(router.state.errors).toBeNull();

    // When / Then: Korean loader error
    await router.navigate('/route-error');
    expect(router.state.location.pathname).toBe('/route-error');
    const koErrors = Object.values(router.state.errors ?? {});
    expect(koErrors[0]).toBeInstanceOf(CoreRouteLoaderError);
    expect(koErrors[0]).toMatchObject({
      message: '라우트 loader에서 데이터를 불러오지 못해 OwpRouteErrorElement로 전환했습니다.',
    });

    // When / Then: recovery and dynamic English loader error on the same router instance
    await router.navigate('/list');
    expect(router.state.errors).toBeNull();
    await i18next.changeLanguage('en');
    try {
      await router.navigate('/route-error');
      const enErrors = Object.values(router.state.errors ?? {});
      expect(enErrors[0]).toMatchObject({
        message: 'The route loader failed to load data and switched to OwpRouteErrorElement.',
      });
    } finally {
      await i18next.changeLanguage('ko');
    }
  });

  it('locks and unlocks bounded page lock tasks on completion, failure, and callback errors', () => {
    // Given
    const lockHistory: PageLockLoadingProps[] = [];
    const outcomes: string[] = [];
    const events: [string, string][] = [];
    const timerRef: { current: number | null } = { current: null };
    const scheduledCallbacks: (() => void)[] = [];
    const cancelledIds: number[] = [];

    // When: bounded task starts and completes
    startBoundedPageLockTask({
      title: '작업 처리 중...',
      durationMs: 600,
      timerRef,
      setLoading: (next) => lockHistory.push(next),
      setOutcome: (next) => outcomes.push(next),
      onRecord: (name, detail) => events.push([name, detail]),
      scheduleTimeout: (callback) => {
        scheduledCallbacks.push(callback);
        return 42;
      },
      cancelTimeout: (id) => cancelledIds.push(id),
    });
    expect(timerRef.current).toBe(42);
    expect(lockHistory.at(-1)).toEqual({ loading: true, title: '작업 처리 중...' });
    scheduledCallbacks[0]?.();

    // Then
    expect(timerRef.current).toBeNull();
    expect(lockHistory.at(-1)).toEqual({ loading: false });
    expect(outcomes.at(-1)).toBe('작업 완료 후 잠금 해제');
    expect(events).toContainEqual(['pageLock.unlock', 'completed']);

    // When / Then: simulated failure unlocks in finally
    runFailedPageLockTask({
      title: '작업 처리 중...',
      timerRef,
      setLoading: (next) => lockHistory.push(next),
      setOutcome: (next) => outcomes.push(next),
      onRecord: (name, detail) => events.push([name, detail]),
      cancelTimeout: (id) => cancelledIds.push(id),
    });
    expect(lockHistory.at(-1)).toEqual({ loading: false });
    expect(outcomes.at(-1)).toBe('오류 발생 후 finally에서 잠금 해제');
    expect(events).toContainEqual(['pageLock.error', 'unlocked']);

    // When / Then: unexpected error in onRecord cancels timer, unlocks, and rethrows
    expect(() =>
      startBoundedPageLockTask({
        title: '작업 처리 중...',
        durationMs: 600,
        timerRef,
        setLoading: (next) => lockHistory.push(next),
        setOutcome: (next) => outcomes.push(next),
        onRecord: () => {
          throw new TypeError('Observer failure');
        },
        scheduleTimeout: () => 99,
        cancelTimeout: (id) => cancelledIds.push(id),
      }),
    ).toThrow(TypeError);
    expect(cancelledIds).toContain(99);
    expect(timerRef.current).toBeNull();
    expect(lockHistory.at(-1)).toEqual({ loading: false });
  });

  it('captures and restores installed owpEnv snapshots and derives primitive env summaries', () => {
    // Given
    const map = new Map<string, string>([
      [STORAGE_KEYS.owpEnv, JSON.stringify({ apiBaseUrl: '/api' })],
    ]);
    const storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value);
      },
      removeItem: (key: string) => {
        map.delete(key);
      },
    };

    // When
    const snapshot = readStoredOwpEnvSnapshot(storage, STORAGE_KEYS.owpEnv);
    storage.setItem(STORAGE_KEYS.owpEnv, JSON.stringify({ apiBaseUrl: '' }));
    const emptySummary = summarizeStoredEnv({ apiBaseUrl: '' });
    restoreStoredOwpEnvSnapshot(storage, STORAGE_KEYS.owpEnv, snapshot);

    // Then
    expect(emptySummary).toEqual({ keyCount: 1, hasApiBaseUrl: false });
    expect(map.get(STORAGE_KEYS.owpEnv)).toBe(JSON.stringify({ apiBaseUrl: '/api' }));
  });
});
