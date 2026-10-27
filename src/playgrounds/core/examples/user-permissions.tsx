import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Link, Typography } from '@mui/material';
import { OwpTable } from '@owp/components';
import { OwpStoreProvider } from '@owp/core/contexts';
import { STORAGE_ACCESS_TOKEN_KEY, STORAGE_KEYS } from '@owp/core/constants';
import {
  useApplyAuthenticatedUser,
  useGetCurrentSettings,
  useGetCurrentUser,
  usePagePermission,
  useSetNavigationList,
  useSetSettings,
} from '@owp/core/hooks';
import type { OwpSettingsConfigType } from '@owp/core/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';
import {
  createPermissionNavigation,
  permissionPresets,
  permissionRoles,
  type PermissionRole,
} from '../model/permission-presets';

const storageKeys = [
  STORAGE_ACCESS_TOKEN_KEY,
  STORAGE_KEYS.currentUser,
  STORAGE_KEYS.currentUserId,
  STORAGE_KEYS.currentUserSeq,
  STORAGE_KEYS.navigationList,
] as const;
type StorageSnapshot = readonly (readonly [string, string | null])[];

function restoreStorage(storage: Storage, snapshot: StorageSnapshot) {
  const failures: DOMException[] = [];
  for (const [key, raw] of snapshot) {
    try {
      if (raw === null) storage.removeItem(key);
      else storage.setItem(key, raw);
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      failures.push(error);
    }
  }
  if (failures.length)
    throw new AggregateError(failures, 'Could not restore sample session storage');
}

function UserPermissionsDemo({
  onRecord,
  onData,
  settings,
}: CoreExampleProps & { readonly settings: OwpSettingsConfigType }) {
  const { t } = useOwpTranslation();
  const applyAuthenticatedUser = useApplyAuthenticatedUser();
  const currentUser = useGetCurrentUser<(typeof permissionPresets)[PermissionRole]['user']>();
  const setNavigationList = useSetNavigationList();
  const setSettings = useSetSettings();
  const permission = usePagePermission();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<PermissionRole>('Super admin');
  const [sessionReady, setSessionReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const initialized = useRef(false);
  const applied = sessionReady && currentUser?.USERID === permissionPresets[role].user.USERID;
  const navigation = applied ? createPermissionNavigation(role) : [];

  const applyRole = useCallback(
    (nextRole: PermissionRole) => {
      setRole(nextRole);
      try {
        const preset = permissionPresets[nextRole];
        const response = applyAuthenticatedUser({
          user: { ...preset.user, navigation: createPermissionNavigation(nextRole) },
          skipCommonCodeInit: true,
        });
        // 프런트엔드 메뉴 모드에서도 샘플의 메뉴와 권한을 함께 적용합니다.
        setNavigationList(createPermissionNavigation(nextRole));
        setSessionReady(true);
        setStorageError(false);
        onRecord('auth.apply', JSON.stringify({ role: nextRole, userId: response.userId }));
      } catch (error) {
        if (!(error instanceof DOMException)) throw error;
        setSessionReady(false);
        setStorageError(true);
        try {
          setNavigationList([]);
        } catch (storageFailure) {
          if (!(storageFailure instanceof DOMException)) throw storageFailure;
          onRecord('storage.clear.error', storageFailure.name);
        }
        onRecord('storage.error', error.name);
      }
    },
    [applyAuthenticatedUser, onRecord, setNavigationList],
  );

  useEffect(() => {
    setSettings(settings);
  }, [settings, setSettings]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void navigate('/items', { replace: true });
    applyRole('Super admin');
  }, [applyRole, navigate]);

  useEffect(() => {
    onData({
      applied,
      selectedRole: role,
      appliedRole: applied ? role : null,
      appliedUserId: applied ? currentUser.USERID : null,
      pathname,
      currentUser: applied
        ? {
            USERID: currentUser.USERID,
            USERSEQ: currentUser.USERSEQ,
            USERNAME: currentUser.USERNAME,
          }
        : null,
      navigationList: applied ? createPermissionNavigation(role) : [],
      permission: applied
        ? {
            isMatched: permission.isMatched,
            menuId: permission.menuId,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
          }
        : null,
      storageError,
    });
  }, [applied, currentUser, onData, pathname, permission, role, storageError]);

  function permissionMark(allowed: boolean) {
    return (
      <Box
        component="span"
        role="img"
        aria-label={t(allowed ? '가능' : '불가')}
        sx={{ color: allowed ? 'success.main' : 'error.main', fontWeight: 700 }}
      >
        {allowed ? 'O' : 'X'}
      </Box>
    );
  }

  return (
    <CoreDemo
      controls={
        <CoreChoice
          label="샘플 사용자"
          value={role}
          options={permissionRoles}
          onChange={applyRole}
        />
      }
    >
      <DemoSection description="사용자를 선택하면 샘플 인증 정보와 메뉴가 바로 바뀝니다. Core는 메뉴의 C/R/U/D 플래그로 권한을 판단합니다.">
        {storageError && (
          <Alert severity="error">{t('샘플 사용자 정보를 저장하지 못했습니다.')}</Alert>
        )}
        {!storageError && (
          <Typography variant="body2" role="status">
            {applied
              ? t('적용된 사용자: {{role}} ({{userId}})', { role, userId: currentUser.USERID })
              : t('샘플 사용자 상태를 준비하고 있습니다.')}
          </Typography>
        )}
        <Typography variant="body2">{t('현재 페이지: {{path}}', { path: pathname })}</Typography>
        <OwpTable
          aria-label={t('적용된 사용자의 페이지 권한')}
          size="small"
          sx={{ width: '100%' }}
          headers={{
            page: 'LINK',
            create: 'CREATE',
            read: 'READ',
            update: 'UPDATE',
            delete: 'DELETE',
          }}
          rows={navigation.map((item) => {
            const active = pathname === item.url;
            return {
              page: (
                <Link
                  component={RouterLink}
                  to={item.url ?? '/items'}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onRecord('navigate', item.url ?? '/items')}
                >
                  {t(item.title ?? '')}
                </Link>
              ),
              create: permissionMark(
                active ? permission.canCreate : item.permission?.C_PERMISSION === 'T',
              ),
              read: permissionMark(
                active ? permission.canRead : item.permission?.R_PERMISSION === 'T',
              ),
              update: permissionMark(
                active ? permission.canUpdate : item.permission?.U_PERMISSION === 'T',
              ),
              delete: permissionMark(
                active ? permission.canDelete : item.permission?.D_PERMISSION === 'T',
              ),
            };
          })}
        />
      </DemoSection>
    </CoreDemo>
  );
}

export function CoreExample(props: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const settings = useGetCurrentSettings();
  const [storageState, setStorageState] = useState<'capturing' | 'ready' | 'error'>('capturing');

  useEffect(() => {
    let storage: Storage;
    let snapshot: StorageSnapshot;
    try {
      storage = window.localStorage;
      snapshot = storageKeys.map((key) => [key, storage.getItem(key)] as const);
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      setStorageState('error');
      return;
    }
    setStorageState('ready');
    return () => restoreStorage(storage, snapshot);
  }, []);

  if (storageState !== 'ready')
    return (
      <Alert role="status" severity={storageState === 'error' ? 'error' : 'info'}>
        {storageState === 'error'
          ? t('저장소에 접근할 수 없어 사용자 예제를 준비하지 못했습니다.')
          : t('샘플 사용자 상태를 준비하고 있습니다.')}
      </Alert>
    );

  return (
    <OwpStoreProvider preloadedState={{ owpSettings: { current: settings } }}>
      <UserPermissionsDemo {...props} settings={settings} />
    </OwpStoreProvider>
  );
}
