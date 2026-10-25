export const coreGuides = [
  {
    id: '@owp/core:guide.setup',
    packageId: 'core',
    title: 'Core 연결과 실행 조건',
    description: 'Core 8.1.0의 앱 초기화·인증·라우팅·테마·설정 저장과 provider 연결 조건.',
    api: [
      'OwpCoreProvider',
      'OwpDialogsProvider',
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

@owp/core/owp-app.css의 utility class는 html 10px rem 기준. MUI의 typography.htmlFontSize를 10으로 맞춰 pxToRem 계산을 일치시킨다. 앱의 기존 root 레이아웃과 충돌 여부를 확인한다. 정적 아이콘·폰트는 @owp/core/vite/owpCoreAssetsPlugin의 owpCoreAssetsPlugin으로 복사할 수 있다. MUI theme와 Core settings의 theme.main.table·dataGrid는 별도 공개 설정이며 예제 provider에서 같은 light/dark palette를 연결한다. DataGrid의 중첩 Theme 2.2.0과 앱의 Theme 2.2.1은 같은 공개 runtime export와 기본 토큰을 유지하지만 각각 Context를 생성한다. Playground의 Vite resolve.dedupe는 @owp/theme만 앱 설치본으로 연결한다. 원래 설치된 의존 버전과 브라우저 번들의 공유 모듈을 구분한다. ThemePreviewTable* 공개 이름은 공통 OwpTable* 타입의 호환 alias이며 기존 기본값·저장 파일 형식을 유지한다.

언어 선택은 Core의 kr/en/lc와 앱의 ko/en을 구분한다. 예제는 reloadOnChange=false이며 kr/lc를 ko로 연결한다. Core 언어 store와 앱 header 선택을 동기화하는 bridge는 Playground의 소비 코드다.

Provider와 앱 초기화는 기존 시작하기에서 확인한다. 실행 예제는 API·데이터 연결, 앱 상태·설정, 전역 상태·복구, UI Adapter 순서로 구성하며 기존 예제 ID와 URL을 유지한다. Core가 소유하는 provider·API·hook·store·타입은 메뉴 분류와 관계없이 Core 공개 경로에서 가져온다. 공통 UI는 Components 공개 API에서 가져오고 앱 정책은 Core의 provider·hook·utility와 연결한다. 기존 Core adapter 자체를 설명하는 구간은 Core import를 유지하며 동일 정책을 중복 적용하지 않는다. OwpQuerySelector·공통코드 선택·언어 전환·Excel 내보내기 버튼·OwpRouteErrorElement는 현재 Core에만 공개되어 있으므로 Components로 이전하지 않는다.`,
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
      'OwpPageContent',
      'OwpPageCarded',
      '@owp/components:OwpPageContent',
      '@owp/components:OwpPageCarded',
      '@owp/components:OwpDialog',
      '@owp/components:OwpErrorBoundary',
      'useDialogPolicy',
      'usePageCardedPolicy',
      'errorBoundaryPolicy',
      'OwpCoreResponsiveLayoutGlobalStyles',
      'OwpSearchFilter',
      'useOwpDialogs',
      'OwpDialog',
      '@owp/components:OwpLoading',
      'usePageLockLoading',
      'useGetPageLockLoading',
      'useSearchAction',
      'usePageLeaveGuard',
      'OwpErrorBoundary',
      'OwpRouteErrorElement',
      'OwpTable',
      'OwpFieldTable',
      '@owp/components:OwpTable',
      '@owp/components:OwpFieldTable',
      'OwpExportDataToExcelButton',
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
    body: `Components OwpPageContent는 title·leftSlot·centerSlot·actions와 본문을 조합하고 responsiveLayoutGlobalStyles slot에 Core의 OwpCoreResponsiveLayoutGlobalStyles를 연결한다. Components OwpPageCarded는 header·content·sidebar를 구성한다. usePageCardedPolicy에 기존 isDirty·scroll=normal·fillContentHeight=false·responsiveLayout을 전달하고 반환 props와 styles를 모두 연결한다. styles는 스크롤과 Core 반응형 전역 스타일을 제공하며 props만 전달하는 것으로 대체할 수 없다.

OwpSearchFilter의 onSubmit은 Promise를 반환할 수 있다. 예제는 공개 useQueryClient의 fetchQuery로 900ms 로컬 작업을 등록하며 submitProgressFilter로 해당 요청을 구분한다. 취소·조건 초기화·unmount에서 cancelQueries를 호출하고 AbortSignal로 타이머를 정리한다. 서버 조회나 저장을 수행하는 예제가 아니다.

Table·FieldTable·Dialog·PageCarded·PageContent·SearchFilter·ErrorBoundary의 시각 구현은 Components가 소유하고, Core는 앱 정책을 연결하는 실제 adapter를 제공한다. Core OwpTable은 settings의 table·dataGrid 테마를 적용하고 OwpFieldTable은 table.field 테마와 Date Picker의 날짜 formatter를 연결한다. PageCarded는 페이지 이탈 가드·스크롤, PageContent는 반응형 스타일, SearchFilter는 useSearchAction의 진행·취소를 연결한다. 앱 설정의 Table·FieldTable과 query 진행 정책을 시연하는 SearchFilter는 기존 Core adapter를 유지한다. Dialog·PageCarded·PageContent·ErrorBoundary 예제는 Components UI에 공개 Core 정책을 연결한다. 기존 Core adapter는 이미 같은 정책을 적용하므로 hook·styles·errorBoundaryPolicy를 다시 덧씌우지 않는다. 순수 UI 사용법만을 위한 독립 예제는 추가하지 않는다.

useOwpDialogs의 open은 다이얼로그 종료 결과를 Promise로 반환한다. 다이얼로그 예제는 이 결과를 상태에 반영한다. Components OwpDialog에 useDialogPolicy({open, isDirty, discardGuard, responsiveLayout})의 props를 연결하고 styles를 함께 render한다. Core policy는 닫기·ESC의 미저장 변경 확인, dialog manager lifecycle·stack·focus를 연결한다. policy props의 confirmation·onRequestClose·preserveCancelFocus·onEntered·stackIndex를 임의로 덮어쓰지 않는다. 외부 open 상태 변경이나 직접 저장은 제한하지 않는다. submitOnConfirm=true는 확인 버튼을 form submit으로 연결하며 예제는 onSubmit에서 저장을 처리한다.

OwpLoading·OwpFloatingPanel·OwpHidden은 @owp/components에서 직접 import한다. OwpLoadingProps·OwpLoadingVariant·OwpFloatingPanelProps·OwpHiddenProps도 @owp/components/types 소유이며 Core 호환 export는 없다. loading 예제의 표시 여부·variant·size는 공통 UI 옵션. Core 전역 loading lock은 usePageLockLoading과 OwpUiProvider가 연결하며 useGetPageLockLoading으로 상태를 읽는다. 정책 예제는 종료·실패·예제 이탈에서 lock을 해제한다.

OwpUiProvider의 queryCancellation.routeChange·pageExit는 기본 true이며 query meta의 cancelOnRouteChange·cancelOnPageExit로 개별 예외를 설정한다. useSearchAction.cancel은 현재 filter에 맞는 query의 취소와 callback 정리가 끝난 뒤 완료. 이는 요청 취소 정책이며 서버 저장 취소나 일반 Promise의 강제 중단을 보장하지 않는다.

Components OwpErrorBoundary에 @owp/core/utils의 errorBoundaryPolicy를 연결해 Core의 onErrorRecovery·onError 정책을 사용한다. 기존 Core OwpErrorBoundary adapter는 이를 이미 적용하므로 다시 spread하지 않는다. OwpRouteErrorElement도 Core에 유지하며 Data Router의 loader·route 오류를 해석. 일반 render 오류의 예제 복구 버튼은 key로 경계를 다시 생성한다. dynamic import chunk 오류는 현재 URL과 오류 내용의 복구 key를 sessionStorage에 기록할 수 있을 때 같은 key당 한 번 reload를 시도하며, 저장할 수 없으면 reload하지 않는다. 이 앱 전체 reload 정책과 예제의 수동 복구는 별개다. API 요청 오류를 render 오류로 가장하지 않는다.

OwpExportDataToExcelButton은 로컬 배열·header·columnMappers를 실제 XLSX 파일로 내보낸다. onClick은 다운로드 요청 이벤트이며 파일 생성 완료 callback이 아니다.

API 요청·사용자 권한·Excel·페이지·검색 예제의 결과 표와 dialog 예제의 저장 결과 표는 보조 UI이므로 @owp/components의 OwpTable·OwpFieldTable을 직접 사용한다. 앱 설정 예제는 Core adapter의 설정·formatter 연결을 시연하므로 Core Table·FieldTable을 유지한다. OwpStyleProvider는 @owp/theme을 통해 Components에도 table·dataGrid 테마를 제공하므로 테마 반응에 Core UI import가 반드시 필요한 것은 아니다. 타입도 사용하는 구현의 계약을 따른다. DialogProps<TPayload, TResult>는 dialog manager가 주입하는 Core 계약이며 @owp/core/types에 유지한다. Core adapter용 OwpDialogProps의 isDirty·discardGuard와 @owp/components/types의 UI용 OwpDialogProps는 서로 다른 계약이다. Components Table·FieldTable props는 @owp/components/types의 공개 타입을 사용하며 FieldTable의 날짜 표시는 해당 공개 계약에 맞게 dateFormatter를 제공한다. 예제의 Core import 검사도 카테고리를 기준으로 일괄 금지하지 않고 symbol별 adapter 시연 여부를 확인한다.`,
  },
];
