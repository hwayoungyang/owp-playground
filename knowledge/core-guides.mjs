import {
  coreOwnershipIntroduction,
  coreOwnershipNotes,
  coreOwnershipUsageNote,
} from '../src/playgrounds/core/guides/package-ownership.ts';

export const coreGuides = [
  {
    id: '@owp/core:guide.setup',
    packageId: 'core',
    title: 'Core 연결과 실행 조건',
    description: 'Core 8.1.0의 앱 초기화·인증·라우팅·테마·설정 저장과 provider 연결 조건.',
    api: [
      'OwpCoreProvider',
      '@owp/components:OwpDialogsProvider',
      'OwpStyleProvider',
      'OwpUiProvider',
      'createOwpApiHooks',
      'useApplyAuthenticatedUser',
      'usePagePermission',
      'useInitApp',
      'useChangeOwpTheme',
      'useGetCurrentSettings',
      'useGetDefaultSettings',
      'useSetSettings',
      'useResetSettings',
      'useStorage',
    ],
    examples: [
      'getting-started',
      'app-settings',
      'api-query',
      'user-permissions',
      'language-switcher',
    ],
    body: `Core는 앱 초기화·인증·라우팅·설정·API와 공통 UI를 연결하는 앱 정책을 소유한다. 공통 UI의 시각 구현은 Components, 테마 기본값과 해석은 Theme, 날짜 처리는 Date Picker의 공개 API를 사용한다. 설치본은 @owp/core 8.1.0, @owp/components 3.1.1, @owp/theme 2.2.1, @owp/date-picker 2.0.3이다. React·MUI·Emotion·i18next, react-router-dom, react-hook-form, notistack, @owp/excel의 peer 범위는 설치본 package.json을 따른다.

OwpCoreProvider는 app config, 독립 Jotai store, React Query와 MUI StyledEngineProvider를 조합한다. configs에는 routesConfig와 navigationConfig를 지정한다. QueryClient 설정과 storePreloadedState는 선택 사항. OwpStyleProvider는 Core settings의 테마 또는 명시한 MUI theme를 적용한다. useInitApp은 앱 진입 시 로고·title·navigation·page loading을 초기화. 시작 코드에 제시한 앱 초기화와 예제별 실행 환경을 구분한다.

createOwpApiHooks로 API base URL·성공 resultCode·오류 표시 정책을 설정하고 useApiQuery·useApiMutation을 사용한다. API 요청 예제는 mock JSON으로 정상·빈 응답·실패를 확인한다. useApplyAuthenticatedUser는 인증 성공 응답의 사용자·token·navigation을 Core 상태에 적용한다. 사용자와 페이지 권한 예제는 샘플 응답을 사용하며 실제 서버 인증을 수행하지 않는다. usePagePermission은 저장된 메뉴 목록과 현재 MemoryRouter 경로를 맞춰 조회·수정 권한을 계산한다.

공통 alert/confirm hook은 OwpDialogsProvider 아래에서 사용한다. OwpUiProvider는 Data Router 안에서 dialog manager·snackbar·페이지 이탈 보호·query 취소·전역 loading lock을 연결한다. 기본 예제는 기존 MemoryRouter 환경을 사용하며, page-carded·loading·error-boundary의 정책 예제만 독립 Data Router와 OwpUiProvider를 사용한다. 이 runtime은 apiBaseUrl을 비워 공통코드 자동 요청을 막고 실제 인증·backend 초기화를 수행하지 않는다. 내부 경로를 전환할 때 Playground의 예제 URL은 유지한다.

useSetSettings는 현재 settings를 기본 설정과 병합하고, useChangeOwpTheme는 main·navbar·toolbar·footer theme set을 기본·현재 설정에 반영한다. useResetSettings는 현재 설정을 기본 설정으로 되돌린다. 이 동작은 settings의 영속 저장을 보장하지 않는다. useStorage의 getEnv·setEnv는 앱 환경 저장 API이며 설정 저장 API가 아니다. resetStorage는 보존 대상 key를 제외한 storage를 초기화하므로 예제에서 호출하지 않는다. 앱에서 설정을 저장하려면 저장 위치·복원 시점·사용자별 범위를 별도로 지정한다.

@owp/core/owp-app.css의 utility class는 html 10px rem 기준. MUI의 typography.htmlFontSize를 10으로 맞춰 pxToRem 계산을 일치시킨다. 앱의 기존 root 레이아웃과 충돌 여부를 확인한다. 정적 아이콘·폰트는 @owp/core/vite/owpCoreAssetsPlugin의 owpCoreAssetsPlugin으로 복사할 수 있다. MUI theme와 Core settings의 theme.main.table·dataGrid는 별도 공개 설정이며 예제 provider에서 같은 light/dark palette를 연결한다. DataGrid의 중첩 Theme 2.2.0과 앱의 Theme 2.2.1은 같은 공개 runtime export와 기본 토큰을 유지하지만 각각 Context를 생성한다. Playground의 Vite resolve.dedupe는 @owp/theme만 앱 설치본으로 연결한다. 원래 설치된 의존 버전과 브라우저 번들의 공유 모듈을 구분한다. 테이블 설정 타입은 @owp/theme/types의 OwpTable* 타입을 직접 사용한다. 기존 기본값·저장 파일 형식은 유지한다.

언어 선택은 Core의 kr/en/lc와 앱의 ko/en을 구분한다. 예제는 reloadOnChange=false이며 kr/lc를 ko로 연결한다. Core 언어 store와 앱 header 선택을 동기화하는 bridge는 Playground의 소비 코드다.

Provider와 앱 초기화는 시작하기에서 확인한다. 공통 Dialog·Table·PageCarded·PageContent·SearchFilter·ErrorBoundary는 Components, ZIP은 Utils, Excel workbook 생성은 Excel의 공개 API를 사용한다. Core는 공통 UI의 래퍼·policy·호환 재노출을 제공하지 않는다. OwpQuerySelector·공통코드 선택·언어 전환·OwpRouteErrorElement는 앱 통합 기능으로 Core에 남는다.`,
  },
  {
    id: '@owp/core:guide.selection',
    packageId: 'core',
    title: 'API·공통코드 선택',
    description: '실제 요청과 공통코드 cache를 사용하는 선택 컴포넌트.',
    api: [
      'OwpQuerySelector',
      'OwpCommonCodeSelector',
      'OwpCommonCodeRadioGroup',
      'OwpCommonCodeQuerySelector',
    ],
    examples: ['query-selector', 'common-code'],
    body: `OwpQuerySelector는 apiUrl로 받은 목록을 valueKey/labelKey 또는 resolver를 사용해 option으로 변환한다. Select와 Autocomplete 모드를 지원한다. apiBaseUrl이 준비된 Core provider가 필요하다. responseListKey의 기본 OWP 응답 목록 구조와 resultCode 판정은 설치본 계약을 따른다.

이 예제는 src/playgrounds/core/data의 JSON을 ?url&no-inline으로 불러 실제 same-origin 요청을 실행한다. 정상·빈 목록·실패 resultCode를 별도 파일로 제공하며 외부 서버와 fetch 교체를 사용하지 않는다. 정적 JSON은 서버 검색 조건을 처리하지 않는다. queryKeyDeps로 필터·언어 변경을 query key에 반영한다. queryClientConfig에서 retry=false로 설정해 실패 상태를 즉시 비교한다.

OwpCommonCodeSelector와 OwpCommonCodeRadioGroup은 groupId에 맞는 초기화된 공통코드 cache가 필요하다. 실제 앱은 서버 초기화 과정에서 cache를 제공한다. 예제는 독립 OwpStoreProvider 안에서 공개 useSetCommonCodeList로 샘플을 넣고, setter가 기록한 sessionStorage 원문을 즉시 복원한다. 기존 cache 저장 내용을 보존한다.`,
  },
  {
    id: '@owp/core:guide.composition',
    packageId: 'core',
    title: '페이지·검색·공통 상태 관리',
    description: 'Core의 페이지 구성·검색 진행·다이얼로그 상태·오류 복구와 소비 앱의 책임.',
    api: [
      '@owp/components:OwpPageContent',
      '@owp/components:OwpPageCarded',
      '@owp/components:OwpDialog',
      '@owp/components:OwpErrorBoundary',
      '@owp/utils:recoverFromDynamicImportChunkLoadError',
      '@owp/components:OwpSearchFilter',
      '@owp/components:useOwpDialogs',
      '@owp/components:OwpLoading',
      'usePageLockLoading',
      'useGetPageLockLoading',
      'useSearchAction',
      'usePageLeaveGuard',
      'OwpRouteErrorElement',
      '@owp/components:OwpTable',
      '@owp/components:OwpFieldTable',
      '@owp/excel:createExportDataToExcelBuffer',
    ],
    examples: [
      'page-content',
      'app-settings',
      'page-carded',
      'search-filter',
      'dialog',
      'loading',
      'error-boundary',
      'excel-export',
    ],
    body: `${coreOwnershipIntroduction} ${Object.values(coreOwnershipNotes)
      .map((note) => `${note.name}: ${note.body}`)
      .join(' ')} ${coreOwnershipUsageNote}

useOwpDialogs는 Components의 OwpDialogsProvider 아래에서 결과 Promise를 반환한다. DialogProps는 @owp/components/types, useConfirm·useDiscardGuard는 @owp/components/hooks를 사용한다. OwpDialog의 isDirty·discardGuard prop이 닫기 확인을 처리하며 lifecycle·stack·focus 복원도 Components가 소유한다.

Core useSearchAction은 run·cancel·isRunning·isCanceling을 제공한다. 페이지는 이 값을 Components OwpSearchFilter에 직접 전달하고 progressFilter로 추적할 query를 지정한다. 일반 Promise의 강제 중단이나 서버 저장 취소를 보장하지 않는다. 페이지 이동의 미저장 상태는 Core usePageLeaveGuard에 전달한다.

Core OwpStyleProvider는 앱 설정을 Theme와 Components에 전달한다. Table·FieldTable·스크롤·반응형 스타일은 공통 패키지에서 직접 사용하며 FieldTable 날짜는 명시적인 dateFormatter로 표시한다. Core loading lock과 route/page exit query 취소는 OwpUiProvider가 연결한다.

일반 render 오류는 Components OwpErrorBoundary, Data Router 오류 해석은 Core OwpRouteErrorElement를 사용한다. chunk 복구 callback은 Utils/browser에서 가져온다. 같은 URL·오류의 sessionStorage key당 한 번 reload를 시도하며 storage 실패 시 reload하지 않는다. 오류 보고 callback은 앱에서 지정한다.

Excel 예제는 @owp/excel의 createExportDataToExcelBuffer와 exportExcelByBuffer를 MUI Button에서 호출한다. ZIP은 @owp/utils/zip의 saveZipFile에 파일 목록과 최종 다운로드 이름을 전달한다. 변환·번역·알림은 호출부가 정한다. createJsonBody·createJsonString은 OWP 요청 계약으로 Core에 남으며 중복 rebuildValue API는 제공하지 않는다.`,
  },
];
