import { STORAGE_KEYS } from '@owp/core/constants';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import {
  coreDemoStorage,
  readStoredOwpEnvSnapshot,
  restoreStoredOwpEnvSnapshot,
} from '../model/policy';

/** 예제 교체·초기화를 포함한 Core 실행 영역의 수명 동안 진입 전 환경을 보존합니다. */
export function CoreEnvironmentScope({ children }: { readonly children: ReactNode }) {
  const [snapshot] = useState(() =>
    readStoredOwpEnvSnapshot(coreDemoStorage(), STORAGE_KEYS.owpEnv),
  );
  useLayoutEffect(
    () => () => restoreStoredOwpEnvSnapshot(coreDemoStorage(), STORAGE_KEYS.owpEnv, snapshot),
    [snapshot],
  );
  return children;
}
