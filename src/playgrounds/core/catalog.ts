export const coreCategories = [
  { id: 'api', label: 'API·데이터 연결' },
  { id: 'state', label: '앱 상태·설정' },
  { id: 'policy', label: '전역 상태·복구' },
  { id: 'integration', label: 'Package Integration' },
] as const;

const entry = <T extends string>(
  id: T,
  title: string,
  category: (typeof coreCategories)[number]['id'],
  description: string,
  api: readonly string[],
) => ({
  id,
  title,
  category,
  description,
  api,
  kind: 'core' as const,
  package: '@owp/core',
  source: `examples/${id}.tsx`,
});

export const coreCatalog = [
  {
    id: 'getting-started',
    title: '시작하기',
    category: 'start',
    description: '',
    api: [
      'OwpCoreProvider',
      'OwpStyleProvider',
      'OwpUiProvider',
      'useInitApp',
      '@owp/utils:recoverFromDynamicImportChunkLoadError',
      '@owp/components:OwpPageCarded',
      '@owp/components:OwpErrorBoundary',
      'OwpRouteErrorElement',
      '@owp/components:OwpTable',
    ],
    kind: 'guide',
    package: '@owp/core',
    source: 'guides/getting-started.tsx',
  },
  entry('api-query', 'API 요청', 'api', 'API hook을 설정하고 조회·빈 결과·오류를 처리합니다.', [
    'createOwpApiHooks',
    '@owp/components:OwpTable',
  ]),
  entry(
    'query-selector',
    'API 선택',
    'api',
    '로컬 응답 데이터를 실제 API selector로 조회하고 선택 값을 확인합니다.',
    ['OwpQuerySelector'],
  ),
  entry(
    'common-code',
    '공통코드 선택',
    'api',
    '같은 공통코드 데이터를 Select와 Radio group으로 선택합니다.',
    ['OwpCommonCodeSelector', 'OwpCommonCodeRadioGroup'],
  ),
  entry(
    'excel-export',
    'Excel 내보내기',
    'api',
    'Excel 패키지로 파일을 생성하고 MUI 버튼에서 다운로드합니다.',
    ['@owp/excel:createExportDataToExcelBuffer', '@owp/components:OwpTable'],
  ),
  entry(
    'app-settings',
    '앱 설정',
    'state',
    'Core 설정·테마를 읽고 변경하며 Components Table·FieldTable에 반영되는 값을 확인합니다.',
    [
      'OwpCoreProvider',
      '@owp/components:OwpTable',
      '@owp/components:OwpFieldTable',
      'useGetCurrentSettings',
      'useGetDefaultSettings',
      'useSetSettings',
      'useChangeOwpTheme',
      'useResetSettings',
      'useStorage',
    ],
  ),
  entry(
    'user-permissions',
    '사용자와 페이지 권한',
    'state',
    '샘플 인증 응답과 메뉴 정보를 적용하고 페이지별 권한을 확인합니다.',
    [
      'useApplyAuthenticatedUser',
      'usePagePermission',
      'useGetCurrentUser',
      '@owp/components:OwpTable',
    ],
  ),
  entry(
    'language-switcher',
    '언어 전환',
    'state',
    'Core 언어 선택으로 한국어·영어 표시를 전환합니다.',
    ['OwpLanguageSwitcherSelect'],
  ),
  entry(
    'dialog',
    '다이얼로그 상태 관리',
    'policy',
    '다이얼로그를 열고 결과를 받아 저장하며 미저장 변경을 보호합니다.',
    ['@owp/components:useOwpDialogs', '@owp/components:OwpDialog', '@owp/components:OwpFieldTable'],
  ),
  entry(
    'confirm',
    '확인과 알림',
    'policy',
    '공통 dialog hook으로 확인·취소에 따른 상태 변화를 확인합니다.',
    ['@owp/components:useOwpDialogs'],
  ),
  entry(
    'loading',
    '로딩 표시',
    'policy',
    '로딩 indicator 옵션과 화면 잠금 로딩 정책을 비교합니다.',
    ['@owp/components:OwpLoading', 'usePageLockLoading', 'useGetPageLockLoading'],
  ),
  entry(
    'error-boundary',
    '오류와 복구',
    'policy',
    '렌더 오류 경계와 Data Router 라우트 오류를 처리하고 복구합니다.',
    [
      '@owp/components:OwpErrorBoundary',
      '@owp/utils:recoverFromDynamicImportChunkLoadError',
      'OwpRouteErrorElement',
    ],
  ),
  entry(
    'page-carded',
    '검색과 페이지',
    'integration',
    '검색 조건과 결과를 페이지의 header·content로 구성하고 페이지 이탈을 보호합니다.',
    [
      '@owp/components:OwpPageCarded',
      'OwpUiProvider',
      'usePageLeaveGuard',
      '@owp/components:OwpPageContent',
      '@owp/components:OwpSearchFilter',
      '@owp/components:OwpTable',
    ],
  ),
  entry(
    'page-content',
    '페이지 콘텐츠',
    'integration',
    '제목·보조 영역·액션을 조합하고 로딩 상태와 반응형 배치를 확인합니다.',
    ['@owp/components:OwpPageContent', '@owp/components:OwpTable'],
  ),
  entry(
    'search-filter',
    '검색 필터',
    'integration',
    '검색 조건을 입력해 조회하고 조건 초기화와 비동기 진행·취소 상태를 확인합니다.',
    ['@owp/components:OwpSearchFilter', '@owp/components:OwpTable'],
  ),
] as const;

export type CoreCatalogEntry = (typeof coreCatalog)[number];
export type CoreExample = Extract<CoreCatalogEntry, { readonly kind: 'core' }>;
export function findCoreEntry(id: string | null): CoreCatalogEntry {
  return coreCatalog.find((example) => example.id === id) ?? coreCatalog[0];
}
