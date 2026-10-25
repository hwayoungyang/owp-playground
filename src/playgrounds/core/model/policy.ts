import type { OwpAppEnv } from '@owp/core/contexts';
import type { PageLockLoadingProps } from '@owp/core/types';
import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

export const POLICY_ROUTER_EXAMPLES = ['page-carded', 'loading', 'error-boundary'] as const;
export type CorePolicyRouterExampleId = (typeof POLICY_ROUTER_EXAMPLES)[number];
export type CoreProviderMode = 'standalone' | 'policy';

const policyRouterExampleIds: ReadonlySet<string> = new Set<string>(POLICY_ROUTER_EXAMPLES);

export function usesCorePolicyRouter(exampleId?: string): exampleId is CorePolicyRouterExampleId {
  return typeof exampleId === 'string' && policyRouterExampleIds.has(exampleId);
}

export function resolveCoreProviderMode(
  exampleId?: string,
  mode?: CoreProviderMode,
): CoreProviderMode {
  return mode ?? (usesCorePolicyRouter(exampleId) ? 'policy' : 'standalone');
}

export function createCoreProviderEnv(mode: CoreProviderMode, origin: string): OwpAppEnv {
  return {
    apiBaseUrl: mode === 'policy' ? '' : origin,
    isAutoLogoutEnabled: false,
    isAccessTokenGuardEnabled: false,
    isI18nEnabled: mode !== 'policy',
    isI18nLanguageSwitcherEnabled: true,
    isErrorMessageEnabled: false,
  };
}

export type StoredEnvSnapshot =
  | { readonly available: false }
  | { readonly available: true; readonly value: string | null };

export function coreDemoStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    return null;
  }
}

export function readStoredOwpEnvSnapshot(
  storage: Pick<Storage, 'getItem'> | null,
  key: string,
): StoredEnvSnapshot {
  if (!storage) return { available: false };
  try {
    return {
      available: true,
      value: storage.getItem(key),
    };
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    return { available: false };
  }
}

export function restoreStoredOwpEnvSnapshot(
  storage: Pick<Storage, 'removeItem' | 'setItem'> | null,
  key: string,
  snapshot: StoredEnvSnapshot,
) {
  if (!snapshot.available || !storage) return;
  try {
    if (snapshot.value === null) storage.removeItem(key);
    else storage.setItem(key, snapshot.value);
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

export function summarizeStoredEnv(env: Readonly<Record<string, unknown>>): {
  readonly keyCount: number;
  readonly hasApiBaseUrl: boolean;
} {
  return {
    keyCount: Object.keys(env).length,
    hasApiBaseUrl: Boolean(env.apiBaseUrl),
  };
}

export class CoreRouteLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoreRouteLoaderError';
  }
}

export function createCorePolicyRoutes({
  rootElement,
  normalElement,
  errorElement,
  getRouteErrorMessage,
}: {
  readonly rootElement: ReactNode;
  readonly normalElement: ReactNode;
  readonly errorElement: ReactNode;
  readonly getRouteErrorMessage: () => string;
}): RouteObject[] {
  return [
    {
      path: '/',
      element: rootElement,
      children: [
        {
          index: true,
          element: normalElement,
        },
        {
          path: 'list',
          element: normalElement,
        },
        {
          path: 'detail',
          element: normalElement,
        },
        {
          path: 'route-error',
          loader: () => {
            throw new CoreRouteLoaderError(getRouteErrorMessage());
          },
          element: normalElement,
          errorElement,
        },
      ],
    },
  ];
}

export class ExamplePageLockTaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExamplePageLockTaskError';
  }
}

export function startBoundedPageLockTask({
  title,
  durationMs,
  timerRef,
  setLoading,
  setOutcome,
  onRecord,
  scheduleTimeout = (callback, ms) => window.setTimeout(callback, ms),
  cancelTimeout = (id) => window.clearTimeout(id),
}: {
  readonly title: string;
  readonly durationMs: number;
  readonly timerRef: { current: number | null };
  readonly setLoading: (next: PageLockLoadingProps) => void;
  readonly setOutcome: (outcome: string) => void;
  readonly onRecord: (name: string, detail: string) => void;
  readonly scheduleTimeout?: (callback: () => void, ms: number) => number;
  readonly cancelTimeout?: (id: number) => void;
}) {
  if (timerRef.current !== null) {
    cancelTimeout(timerRef.current);
    timerRef.current = null;
  }
  try {
    setLoading({ loading: true, title });
    setOutcome('화면 잠금 실행 중');
    timerRef.current = scheduleTimeout(() => {
      timerRef.current = null;
      setLoading({ loading: false });
      setOutcome('작업 완료 후 잠금 해제');
      onRecord('pageLock.unlock', 'completed');
    }, durationMs);
    onRecord('pageLock.start', title);
  } catch (error) {
    if (timerRef.current !== null) {
      cancelTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLoading({ loading: false });
    throw error;
  }
}

export function runFailedPageLockTask({
  title,
  timerRef,
  setLoading,
  setOutcome,
  onRecord,
  task = () => {
    throw new ExamplePageLockTaskError('Simulated failure');
  },
  cancelTimeout = (id) => window.clearTimeout(id),
}: {
  readonly title: string;
  readonly timerRef: { current: number | null };
  readonly setLoading: (next: PageLockLoadingProps) => void;
  readonly setOutcome: (outcome: string) => void;
  readonly onRecord: (name: string, detail: string) => void;
  readonly task?: () => void;
  readonly cancelTimeout?: (id: number) => void;
}) {
  if (timerRef.current !== null) {
    cancelTimeout(timerRef.current);
    timerRef.current = null;
  }
  try {
    setLoading({ loading: true, title });
    onRecord('pageLock.start', 'failure-case');
    task();
  } catch (error) {
    if (!(error instanceof ExamplePageLockTaskError)) throw error;
    setOutcome('오류 발생 후 finally에서 잠금 해제');
    onRecord('pageLock.error', 'unlocked');
  } finally {
    setLoading({ loading: false });
  }
}
