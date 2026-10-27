import {
  useApplyAuthenticatedUser,
  useGetCurrentSettings,
  useGetCurrentUser,
  useGetNavigationList,
  usePagePermission,
  useSetNavigationList,
  useSetSettings,
} from '@owp/core/hooks';
import type { AuthenticatedUser, OwpNavItemType } from '@owp/core/types';
import { useState } from 'react';

// OwpCoreProvider와 Data Router 아래의 페이지에서 호출합니다.
export function useAppState() {
  const user = useGetCurrentUser();
  const navigation = useGetNavigationList();
  const permission = usePagePermission();
  const settings = useGetCurrentSettings();
  const applyAuthenticatedUser = useApplyAuthenticatedUser();
  const setNavigation = useSetNavigationList();
  const setSettings = useSetSettings();
  // 페이지 안에서만 쓰는 선택 값은 로컬 상태로 관리합니다.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function applyLogin(authenticatedUser: AuthenticatedUser) {
    // 서버 인증에 성공한 뒤 해당 응답을 전달합니다.
    return applyAuthenticatedUser({ user: authenticatedUser });
  }

  function replaceNavigation(items: OwpNavItemType[]) {
    setNavigation(items);
  }

  function changeScrollbars(enabled: boolean) {
    setSettings({ ...settings, customScrollbars: enabled });
  }

  return {
    user,
    navigation,
    permission,
    settings,
    selectedId,
    setSelectedId,
    applyLogin,
    replaceNavigation,
    changeScrollbars,
  };
}
