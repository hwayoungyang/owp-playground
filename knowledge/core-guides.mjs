export const coreGuides = [
  {
    id: '@owp/core:guide.setup',
    packageId: 'core',
    title: 'Core 연결과 실행 조건',
    description: 'Core 7.1.0 provider·스타일·정적 리소스와 예제 실행 조건.',
    api: [
      'OwpCoreProvider',
      'OwpDialogsProvider',
      'OwpStyleProvider',
      'OwpUiProvider',
      'createOwpApiHooks',
      'useApplyAuthenticatedUser',
      'usePagePermission',
    ],
    examples: [
      'getting-started',
      'app-settings',
      'api-query',
      'user-permissions',
      'language-switcher',
    ],
    body: `OwpCoreProvider는 app config, 독립 Jotai store, React Query와 MUI StyledEngineProvider를 조합한다. configs에는 routesConfig와 navigationConfig를 지정한다. QueryClient 설정과 storePreloadedState는 선택 사항. 이 Playground는 MemoryRouter와 MUI theme, 초기화한 i18next를 함께 제공한다.

createOwpApiHooks로 API base URL·성공 resultCode·오류 표시 정책을 설정하고 useApiQuery·useApiMutation을 사용한다. API 요청 예제는 mock JSON으로 정상·빈 응답·실패를 확인한다. useApplyAuthenticatedUser는 인증 성공 응답의 사용자·token·navigation을 Core 상태에 적용한다. 사용자와 페이지 권한 예제는 샘플 응답을 사용하며 실제 서버 인증을 수행하지 않는다. usePagePermission은 저장된 메뉴 목록과 현재 MemoryRouter 경로를 맞춰 조회·수정 권한을 계산한다.

공통 alert/confirm hook은 OwpDialogsProvider 아래에서 사용한다. OwpUiProvider의 route 취소·이탈 보호 등은 React Router Data Router가 필요하므로 MemoryRouter로 대체할 수 없다. OwpPageCarded의 isDirty를 활성화하려면 Data Router와 OwpUiProvider를 준비한다. 이 Playground의 페이지 예제는 isDirty를 지정하지 않는다.

@owp/core/owp-app.css의 utility class는 html 10px rem 기준. MUI의 typography.htmlFontSize를 10으로 맞춰 pxToRem 계산을 일치시킨다. 앱의 기존 root 레이아웃과 충돌 여부를 확인한다. 정적 아이콘·폰트는 @owp/core/vite/owpCoreAssetsPlugin의 owpCoreAssetsPlugin으로 복사할 수 있다. MUI theme와 Core settings의 theme.main.table·dataGrid는 별도 공개 설정이며 예제 provider에서 같은 light/dark palette를 연결한다.

실제 설치 버전은 @owp/core 7.1.0이다. React·MUI·Emotion·i18next와 react-router-dom, react-hook-form, notistack, @owp/excel 등의 정확한 peer dependency 범위는 설치본 package.json을 따른다. 패키지 게시나 서버 배포 없이 로컬 예제를 실행한다.

언어 선택은 Core의 kr/en/lc와 앱의 ko/en을 구분한다. 예제는 reloadOnChange=false이며 kr/lc를 ko로 연결한다. Core 언어 store와 앱 header 선택을 동기화하는 bridge는 Playground의 소비 코드다.`,
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
      'OwpSearchFilter',
      'useOwpDialogs',
      'OwpDialog',
      'OwpLoading',
      'OwpErrorBoundary',
      'OwpExportDataToExcelButton',
    ],
    examples: [
      'page-content',
      'page-carded',
      'search-filter',
      'dialog',
      'loading',
      'error-boundary',
      'excel-export',
    ],
    body: `OwpPageContent는 title·leftSlot·centerSlot·actions와 본문을 조합한다. OwpPageCarded는 header·content·sidebar를 구성한다. 예제는 scroll=normal과 fillContentHeight=false로 바깥 main의 세로 스크롤을 유지한다.

OwpSearchFilter의 onSubmit은 Promise를 반환할 수 있다. 예제는 공개 useQueryClient의 fetchQuery로 900ms 로컬 작업을 등록하며 submitProgressFilter로 해당 요청을 구분한다. 취소·조건 초기화·unmount에서 cancelQueries를 호출하고 AbortSignal로 타이머를 정리한다. 서버 조회나 저장을 수행하는 예제가 아니다.

Table·FieldTable의 시각 구현과 Dialog shell은 Framework에서 Components로 이관 중이므로 Core의 독립 UI 예제에서 제외한다. 패키지는 업데이트하지 않았으며 페이지·설정·상태 예제에서 필요한 경우에만 설치된 7.1.0의 Core adapter를 사용한다.

useOwpDialogs의 open은 다이얼로그 종료 결과를 Promise로 반환한다. 다이얼로그 예제는 이 결과를 상태에 반영하고 OwpDialog의 isDirty로 닫기·ESC 시 미저장 변경을 확인한다. 외부 open 상태 변경이나 직접 저장은 제한하지 않는다. submitOnConfirm=true는 확인 버튼을 form submit으로 연결하며 예제는 onSubmit에서 저장을 처리한다. OwpLoading 예제는 표시 여부·variant·size를 비교한다.

OwpErrorBoundary는 하위 render 오류를 처리한다. 예제 복구 버튼은 key로 경계를 다시 생성하며 API 요청 오류를 render 오류로 가장하지 않는다. OwpExportDataToExcelButton은 로컬 배열·header·columnMappers를 실제 XLSX 파일로 내보낸다. onClick은 다운로드 요청 이벤트이며 파일 생성 완료 callback이 아니다.`,
  },
];
