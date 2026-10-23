export const coreCategories = [
  { id: 'app', label: '앱 구성' },
  { id: 'layout', label: '페이지 구성' },
  { id: 'inputs', label: '조회·선택' },
  { id: 'feedback', label: '피드백' },
  { id: 'integration', label: '파일' },
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
    api: ['OwpCoreProvider'],
    kind: 'guide',
    package: '@owp/core',
    source: 'guides/getting-started.tsx',
  },
  entry(
    'app-settings',
    '앱 설정',
    'app',
    'Core provider의 설정을 읽고 변경해 공통 UI에 적용합니다.',
    ['OwpCoreProvider', 'useGetCurrentSettings', 'useSetSettings'],
  ),
  entry('api-query', 'API 요청', 'app', 'API hook을 설정하고 조회·빈 결과·오류를 처리합니다.', [
    'createOwpApiHooks',
  ]),
  entry(
    'user-permissions',
    '사용자와 페이지 권한',
    'app',
    '샘플 인증 응답과 메뉴 정보를 적용하고 페이지별 권한을 확인합니다.',
    ['useApplyAuthenticatedUser', 'usePagePermission', 'useGetCurrentUser'],
  ),
  entry(
    'language-switcher',
    '언어 전환',
    'app',
    'Core 언어 선택으로 한국어·영어 표시를 전환합니다.',
    ['OwpLanguageSwitcherSelect'],
  ),
  entry(
    'page-carded',
    '검색과 페이지',
    'layout',
    '검색 조건과 결과를 페이지의 header와 content로 구성합니다.',
    ['OwpPageCarded'],
  ),
  entry(
    'page-content',
    '페이지 콘텐츠',
    'layout',
    '제목·보조 영역·액션을 조합하고 로딩 상태와 반응형 배치를 확인합니다.',
    ['OwpPageContent'],
  ),
  entry(
    'search-filter',
    '검색 필터',
    'inputs',
    '검색 조건을 입력해 조회하고 조건 초기화와 비동기 진행 상태를 확인합니다.',
    ['OwpSearchFilter'],
  ),
  entry(
    'query-selector',
    'API 선택',
    'inputs',
    '로컬 응답 데이터를 실제 API selector로 조회하고 선택 값을 확인합니다.',
    ['OwpQuerySelector'],
  ),
  entry(
    'common-code',
    '공통코드 선택',
    'inputs',
    '같은 공통코드 데이터를 Select와 Radio group으로 선택합니다.',
    ['OwpCommonCodeSelector', 'OwpCommonCodeRadioGroup'],
  ),
  entry(
    'dialog',
    '다이얼로그 상태 관리',
    'feedback',
    '다이얼로그를 열고 결과를 받아 저장하며 미저장 변경을 보호합니다.',
    ['useOwpDialogs', 'OwpDialog'],
  ),
  entry(
    'confirm',
    '확인과 알림',
    'feedback',
    '공통 dialog hook으로 확인·취소에 따른 상태 변화를 확인합니다.',
    ['useOwpDialogs'],
  ),
  entry('loading', '로딩 표시', 'feedback', '로딩 indicator의 종류와 크기를 비교합니다.', [
    'OwpLoading',
  ]),
  entry(
    'error-boundary',
    '오류와 복구',
    'feedback',
    '오류 경계에서 렌더 오류를 처리하고 복구합니다.',
    ['OwpErrorBoundary'],
  ),
  entry(
    'excel-export',
    'Excel 내보내기',
    'integration',
    '화면 데이터를 공통 Excel 버튼으로 파일에 저장합니다.',
    ['OwpExportDataToExcelButton'],
  ),
] as const;

export type CoreCatalogEntry = (typeof coreCatalog)[number];
export type CoreExample = Extract<CoreCatalogEntry, { readonly kind: 'core' }>;
export function findCoreEntry(id: string | null): CoreCatalogEntry {
  return coreCatalog.find((example) => example.id === id) ?? coreCatalog[0];
}
