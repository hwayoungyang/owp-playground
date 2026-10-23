import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { OwpTable } from '@owp/core';
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
import type { AuthenticatedUser, OwpNavItemType, OwpSettingsConfigType } from '@owp/core/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';

const profiles = ['읽기 전용', '편집 가능'] as const;
const paths = ['/items', '/settings'] as const;
const storageKeys = [
  STORAGE_ACCESS_TOKEN_KEY,
  STORAGE_KEYS.currentUser,
  STORAGE_KEYS.currentUserId,
  STORAGE_KEYS.currentUserSeq,
  STORAGE_KEYS.navigationList,
] as const;
const sampleUser = {
  USERID: 'demo-user',
  USERSEQ: 1,
  USERNAME: 'Playground',
  token: 'playground-sample-token',
} as const satisfies AuthenticatedUser;

type Profile = (typeof profiles)[number];
type StorageSnapshot = readonly (readonly [string, string | null])[];

function navigationFor(profile: Profile): OwpNavItemType[] {
  return paths.map((path) => ({
    id: path,
    title: path === '/items' ? '항목' : '설정',
    url: path,
    type: 'item',
    permission: {
      R_PERMISSION: profile === '편집 가능' || path === '/items' ? 'T' : 'F',
      U_PERMISSION: profile === '편집 가능' ? 'T' : 'F',
      C_PERMISSION: 'F',
      D_PERMISSION: 'F',
    },
  }));
}

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
  const currentUser = useGetCurrentUser<typeof sampleUser>();
  const setNavigationList = useSetNavigationList();
  const setSettings = useSetSettings();
  const permission = usePagePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>('읽기 전용');
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState(false);
  const routeInitialized = useRef(false);
  const pathname = location.pathname;
  const activePath = pathname === '/settings' ? '/settings' : '/items';
  const canRead = applied && permission.canRead;
  const canSave = applied && permission.canUpdate;

  useEffect(() => {
    setSettings(settings);
  }, [settings, setSettings]);

  useEffect(() => {
    if (routeInitialized.current) return;
    routeInitialized.current = true;
    void navigate('/items', { replace: true });
  }, [navigate]);

  useEffect(() => {
    onData({
      applied,
      profile,
      pathname,
      currentUser:
        applied && currentUser?.USERID === sampleUser.USERID
          ? {
              USERID: currentUser.USERID,
              USERSEQ: currentUser.USERSEQ,
              USERNAME: currentUser.USERNAME,
            }
          : null,
      navigationList: applied ? navigationFor(profile) : [],
      permission: applied
        ? {
            isMatched: permission.isMatched,
            menuId: permission.menuId,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
          }
        : null,
      storageError,
    });
  }, [applied, currentUser, onData, pathname, permission, profile, storageError]);

  function updateNavigation(nextProfile: Profile) {
    try {
      setNavigationList(navigationFor(nextProfile));
      setProfile(nextProfile);
      setMessage('');
      setStorageError(false);
      onRecord('navigation.permission', JSON.stringify({ profile: nextProfile, pathname }));
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      setApplied(false);
      setStorageError(true);
      onRecord('storage.error', error.name);
    }
  }

  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice label="권한" value={profile} options={profiles} onChange={updateNavigation} />
          <CoreChoice
            label="경로"
            value={activePath}
            options={paths}
            onChange={(path) => {
              void navigate(path);
              setMessage('');
              onRecord('navigate', path);
            }}
          />
        </>
      }
    >
      <DemoSection description="인증 서버를 호출하지 않고 샘플 인증 응답을 적용합니다.">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              try {
                const response = applyAuthenticatedUser({
                  user: { ...sampleUser, navigation: navigationFor(profile) },
                  skipCommonCodeInit: true,
                });
                setNavigationList(navigationFor(profile));
                setApplied(true);
                setStorageError(false);
                setMessage('샘플 인증 응답을 적용했습니다.');
                onRecord('auth.apply', JSON.stringify({ userId: response.userId }));
              } catch (error) {
                if (!(error instanceof DOMException)) throw error;
                setApplied(false);
                setStorageError(true);
                onRecord('storage.error', error.name);
              }
            }}
          >
            {t('샘플 사용자 적용')}
          </Button>
          <Typography variant="body2">
            {applied && currentUser?.USERID === sampleUser.USERID
              ? `${currentUser.USERNAME} (${currentUser.USERID})`
              : t('사용자 적용 전')}
          </Typography>
        </Box>
        {storageError && (
          <Alert severity="error">{t('샘플 사용자 정보를 저장하지 못했습니다.')}</Alert>
        )}
        <Typography variant="body2">{t('현재 페이지: {{path}}', { path: pathname })}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={!canRead}
            onClick={() => {
              setMessage('샘플 조회 동작을 실행했습니다.');
              onRecord('permission.read', pathname);
            }}
          >
            {t('조회')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={!canSave}
            onClick={() => {
              setMessage('샘플 저장 동작을 실행했습니다.');
              onRecord('permission.update', pathname);
            }}
          >
            {t('저장')}
          </Button>
        </Box>
        <OwpTable
          aria-label={t('페이지 권한')}
          size="small"
          headers={{ page: t('페이지'), path: t('경로'), read: t('조회'), save: t('저장') }}
          rows={navigationFor(profile).map((item) => ({
            page: t(item.title ?? ''),
            path: item.url,
            read: t(applied && item.permission?.R_PERMISSION === 'T' ? '가능' : '불가'),
            save: t(applied && item.permission?.U_PERMISSION === 'T' ? '가능' : '불가'),
          }))}
        />
        {message && (
          <Typography role="status" variant="body2">
            {t(message)}
          </Typography>
        )}
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
