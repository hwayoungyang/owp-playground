import { lazy, useEffect, useState } from 'react';
import { Alert, Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { OwpLayout } from '@owp/core';
import { OwpCoreProvider, OwpStyleProvider, OwpUiProvider } from '@owp/core/contexts';
import type { OwpPageSkeletonSpecMap } from '@owp/core/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import { createCoreProviderEnv } from '../model/policy';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';

const pages = [
  { path: '/list', title: '목록 화면' },
  { path: '/summary', title: '요약 화면' },
] as const;

const pageSkeletonSpecs: OwpPageSkeletonSpecMap = {
  '/list': {
    columns: 10,
    fullscreen: false,
    fillContentHeight: true,
    items: [{ type: 'search-header' }, { type: 'grid', colSpan: 10, rowSpan: 8 }],
  },
  '/summary': {
    columns: 10,
    fullscreen: false,
    fillContentHeight: true,
    items: [
      { type: 'stat', colSpan: 5, rowSpan: 2 },
      { type: 'stat', colSpan: 5, rowSpan: 2 },
      { type: 'chart', colSpan: 10, rowSpan: 6 },
    ],
  },
};

function LoadedPage() {
  const { t } = useOwpTranslation();
  const { pathname } = useLocation();
  const page = pages.find((item) => item.path === pathname);
  return (
    <Box sx={{ p: 2, width: '100%' }}>
      {page && (
        <Typography component="h3" variant="subtitle1" sx={{ mb: 2 }}>
          {t(page.title)}
        </Typography>
      )}
      <Alert severity={page ? 'success' : 'info'}>
        {page
          ? t('{{page}}을 모두 불러왔습니다.', { page: t(page.title) })
          : t('위에서 목록 화면이나 요약 화면을 선택해 주세요.')}
      </Alert>
    </Box>
  );
}

function createSkeletonRuntime() {
  const pending = new Map<string, () => void>();
  const page = (pathname: string) => {
    const Page = lazy(
      () =>
        new Promise<{ default: typeof LoadedPage }>((resolve) => {
          pending.set(pathname, () => {
            pending.delete(pathname);
            resolve({ default: LoadedPage });
          });
        }),
    );
    return <Page />;
  };
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <OwpUiProvider>
          <OwpLayout />
        </OwpUiProvider>
      ),
      children: [
        { index: true, element: <LoadedPage /> },
        { path: 'list', element: page('/list') },
        { path: 'summary', element: page('/summary') },
      ],
    },
  ]);
  return { router, pending };
}

export function CoreExample({ onData, onRecord }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const theme = useTheme();
  const [runtime] = useState(createSkeletonRuntime);
  const [pathname, setPathname] = useState('/');
  const [loaded, setLoaded] = useState<readonly string[]>(['/']);
  const currentPage = pages.find((page) => page.path === pathname);
  const isLoaded = loaded.includes(pathname);

  useEffect(
    () => () => {
      for (const complete of runtime.pending.values()) complete();
      runtime.router.dispose();
    },
    [runtime],
  );

  const navigate = (next: string) => {
    setPathname(next);
    // 예제에서는 대기 중인 lazy 화면의 Skeleton을 즉시 비교할 수 있도록 전환합니다.
    void runtime.router.navigate(next, { flushSync: true });
    onRecord('route', next);
    onData({
      pathname: next,
      firstVisit: !loaded.includes(next),
      skeletonSpec: pageSkeletonSpecs[next],
    });
  };
  const complete = () => {
    runtime.pending.get(pathname)?.();
    setLoaded((previous) => [...previous, pathname]);
    onRecord('loaded', pathname);
    onData({ pathname, firstVisit: false, skeletonSpec: pageSkeletonSpecs[pathname] });
  };

  return (
    <CoreDemo>
      <DemoSection
        title="화면별 로딩 미리보기"
        description="목록·요약 화면을 선택하고, 로딩 전후의 모습을 비교해 보세요."
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={1} role="group" aria-label={t('미리 볼 화면')}>
              {pages.map((page) => (
                <Button
                  key={page.path}
                  variant={pathname === page.path ? 'contained' : 'outlined'}
                  size="small"
                  aria-pressed={pathname === page.path}
                  onClick={() => navigate(page.path)}
                >
                  {t(page.title)}
                </Button>
              ))}
            </Stack>
            <Button variant="outlined" size="small" disabled={isLoaded} onClick={complete}>
              {t('로딩 완료하기')}
            </Button>
          </Stack>
          <Typography variant="body2" role="status">
            {currentPage
              ? t('{{page}} · {{state}}', {
                  page: t(currentPage.title),
                  state: t(isLoaded ? '준비 완료' : '로딩 중'),
                })
              : t('미리 볼 화면을 선택해 주세요.')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              !currentPage
                ? '목록 화면은 검색·표 형태, 요약 화면은 숫자·차트 형태의 Skeleton을 사용합니다.'
                : isLoaded
                  ? '한 번 불러온 화면은 다시 선택할 때 로딩 없이 바로 표시됩니다. 상단의 초기화를 누르면 첫 로딩부터 다시 확인할 수 있습니다.'
                  : 'Skeleton을 살펴본 뒤 로딩 완료하기를 눌러 주세요.',
            )}
          </Typography>
          <Box
            aria-busy={!isLoaded}
            sx={{
              height: 440,
              display: 'flex',
              overflow: 'hidden',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <OwpCoreProvider
              env={createCoreProviderEnv('policy', window.location.origin)}
              configs={{
                routesConfig: [],
                navigationConfig: [],
                settingsConfig: {
                  layout: {
                    config: {
                      navbar: { display: false },
                      toolbar: { display: false },
                      footer: { display: false },
                    },
                  },
                },
              }}
              slotProps={{
                routeLoading: {
                  getSkeletonSpec: (path) => pageSkeletonSpecs[path],
                  releaseOnClick: false,
                },
              }}
              styledEngineProviderProps={{ injectFirst: false, enableCssLayer: false }}
            >
              <OwpStyleProvider theme={theme}>
                <RouterProvider router={runtime.router} />
              </OwpStyleProvider>
            </OwpCoreProvider>
          </Box>
        </Stack>
      </DemoSection>
    </CoreDemo>
  );
}
