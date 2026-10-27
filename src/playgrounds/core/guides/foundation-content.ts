export const coreFoundations = [
  {
    id: 'providers',
    knowledgeId: '@owp/core:guide.providers',
    title: '프로바이더 구성',
    introduction:
      '프로바이더는 페이지들이 같은 앱 환경·상태·요청 캐시·테마와 공통 UI를 사용하도록 실행 범위를 만듭니다. 앱 구성 예시의 AppProviders와 루트 App처럼 Router 바깥의 기반 구성과 Router 안의 화면 구성을 나눕니다.',
    sections: [
      {
        title: 'OwpCoreProvider: 앱 환경과 상태의 시작점',
        body: 'env에는 apiBaseUrl·accessTokenTransport·언어 사용 여부를, configs에는 routesConfig·navigationConfig·settingsConfig를 전달합니다. 이 범위에 독립 Jotai store와 QueryClient가 만들어집니다. queryClientConfig로 재시도·재조회 기본값을 정하거나 이미 생성한 queryClient를 전달할 수 있습니다. storePreloadedState는 지원하는 settings·navbar 초기 상태를 넣는 옵션입니다.',
      },
      {
        title: 'OwpStyleProvider: 설정을 실제 스타일로 적용',
        body: 'OwpCoreProvider 안에 OwpStyleProvider를 두면 현재 settings의 main 테마를 MUI에 제공합니다. 앱 최상위에는 root를 지정해 body class와 전역 스타일을 적용합니다. theme을 직접 전달하면 그 MUI theme이 우선하므로 Core 테마 변경과 동기화하려면 별도 처리가 필요합니다. Emotion cache는 cacheProviderProps.value를 전달한 경우에 연결합니다.',
      },
      {
        title: 'OwpUiProvider: 라우팅과 공통 UI 연결',
        body: 'RouterProvider가 렌더하는 루트 route element 안에 OwpUiProvider를 배치합니다. 다이얼로그·snackbar·페이지 이탈 가드·화면 잠금과 query 취소 정책을 연결하며, queryCancellation.routeChange·pageExit는 기본 true입니다. useInitApp은 이 루트에서 로고·제목·navigation·페이지 로딩을 초기화합니다. Data Router가 필요한 정책을 사용하므로 OwpUiProvider를 RouterProvider 바깥이나 일반 MemoryRouter 아래에 두지 않습니다.',
      },
      {
        title: '설정 방법',
        body: '아래 코드는 앱 구성 예시의 AppProviders → RouterProvider → App 내부 OwpUiProvider 순서를 최소 구성으로 옮긴 예제입니다. 빈 routesConfig·navigationConfig는 Core 메뉴를 만들지 않습니다. 예제의 실제 화면 경로는 createBrowserRouter에 직접 등록하며, 업무 앱에서는 자신의 route·navigation 설정과 페이지를 연결합니다.',
        code: true,
      },
      {
        title: '설정 후 기대효과',
        body: '하위 페이지에서 같은 사용자·설정 상태와 요청 캐시를 읽고, Core 테마와 공통 dialog·loading 정책을 사용할 수 있습니다. query 취소와 페이지 이탈 확인을 페이지마다 새로 조합할 필요가 줄어듭니다. 미저장 변경 감지는 페이지가 isDirty를 제공해야 하고, 취소는 연결된 query와 AbortSignal을 따르므로 서버 저장을 되돌리는 기능은 아닙니다.',
      },
      {
        title: '앱에서 연결할 부분',
        body: '앱 구성 예시의 src/app/AppProviders.tsx는 앱별 env·routes·navigation·settings와 로고·DataGrid 테마 미리보기 slot을 전달하고, src/app/App.tsx는 useInitApp과 OwpUiProvider로 OwpLayout을 감쌉니다. 인증 API·로그인 이동·업무 화면·i18next 초기화는 앱이 구성합니다. OwpUiProvider는 OwpDialogsProvider를 포함하므로 같은 범위에 다시 중첩하지 않습니다.',
      },
    ],
  },
  {
    id: 'state-management',
    knowledgeId: '@owp/core:guide.state',
    title: '상태 관리',
    introduction:
      'Core는 앱 전체에서 공유하는 사용자·메뉴·설정 상태를 관리합니다. 페이지의 입력·선택 값은 React 로컬 상태에, 서버 조회 결과는 QueryClient 캐시에 두어 상태의 수명과 갱신 경로를 분명히 합니다.',
    sections: [
      {
        title: '공유 상태를 읽고 변경하는 방법',
        body: 'useGetCurrentUser·useGetNavigationList·useGetCurrentSettings로 필요한 상태를 구독합니다. 변경은 useApplyAuthenticatedUser·useSetNavigationList·useSetSettings 같은 공개 hook으로 수행합니다. OwpCoreProvider가 store를 제공하므로 페이지마다 새 OwpStoreProvider를 만들지 않습니다. 공개 atom이 필요한 경우에는 @owp/core/store를 사용하며 Jotai를 직접 import할 앱은 Jotai 의존성도 선언합니다.',
      },
      {
        title: '설정 방법',
        body: 'useAppState는 공유 상태와 로컬 선택 값을 구분하는 앱 코드입니다. applyLogin에는 서버가 인증에 성공한 사용자 응답을 전달합니다. 메뉴를 교체하면 usePagePermission이 현재 Router 경로와 메뉴의 CRUD 권한을 기준으로 계산하고, 설정을 변경하면 같은 store를 사용하는 화면에 반영됩니다.',
        code: true,
      },
      {
        title: '설정 후 기대효과',
        body: '화면마다 사용자·메뉴·테마를 props로 전달하지 않고 같은 상태를 구독할 수 있습니다. 인증 성공 시 useApplyAuthenticatedUser가 사용자·token·사용자 ID·USERSEQ·navigation을 관련 상태와 storage에 반영합니다. canRead·canCreate·canUpdate·canDelete로 화면 동작을 제어할 수 있지만 실제 데이터 접근 권한은 서버도 검증해야 합니다.',
      },
      {
        title: '메모리와 저장 상태의 수명',
        body: 'settings·navbar의 일반 변경은 메모리 상태이며 새로고침 후 자동 복원을 보장하지 않습니다. 반면 인증 정보와 navigation 등은 해당 hook이 storage와 연결합니다. store를 분리해도 브라우저 storage까지 분리되는 것은 아닙니다. 사용자별 설정 저장이 필요하면 앱이 저장 key·형식 검증·로그아웃 처리·초기화 이후 복원 시점을 정해야 합니다. useStorage의 getEnv·setEnv는 환경 설정 API로, 사용자 settings 저장 함수가 아닙니다.',
      },
      {
        title: '앱 구성과 동작 확인',
        body: '앱 구성 예시의 LoginForm은 인증 응답을 적용한 뒤 시작 페이지로 이동합니다. 공통코드 초기화가 필요한 앱은 실제 API 환경을 준비하고, 서버를 쓰지 않는 샘플만 skipCommonCodeInit을 사용합니다. 실행 예제의 사용자와 페이지 권한에서 사용자 선택·메뉴 권한·경로 변경을, 앱 설정에서 현재 설정과 기본 설정의 차이를 확인할 수 있습니다.',
      },
    ],
  },
  {
    id: 'api-setup',
    knowledgeId: '@owp/core:guide.api',
    title: 'API 설정',
    introduction:
      'createOwpApiHooks는 API 접속 정보와 응답·인증 오류 정책을 한 번 설정해 조회와 저장 hook을 만듭니다. OwpCoreProvider의 QueryClient는 이 hook들이 사용하는 요청 캐시와 재시도 기본값을 제공합니다.',
    sections: [
      {
        title: '서버 계약에 맞출 설정',
        body: 'baseUrl과 accessTokenTransport를 Provider의 env와 맞춥니다. bearer는 Authorization 헤더로 token을 전달합니다. successResultCode는 OWP 모드에서 서버가 성공으로 반환하는 문자열이며, 지정하면 HTTP 성공과 resultCode의 정확한 일치를 함께 확인합니다. isI18nEnabled를 켜면 언어 query parameter를 전달합니다. authErrors는 resultMessage의 포함 문자열 목록이고, onAuthError는 해당 인증 오류에서 로그인 이동 등을 처리하는 callback입니다. responseMode와 allowMissingResultCode는 factory 설정이 아니라 각 요청의 options에 지정합니다.',
      },
      {
        title: '설정 방법',
        body: '아래 Paths는 설명용 최소 OpenAPI 타입입니다. 실제 앱에서는 생성한 paths와 서버의 endpoint·응답 구조·인증 오류 메시지로 교체합니다. useApiQuery·useApiSuspenseQuery는 조회하고, queryOptions는 QueryClient의 fetchQuery·prefetchQuery에 전달할 설정을 만듭니다. useApiMutation은 호출 시 요청을 실행합니다. 저장 성공 후 생성된 queryKey를 재사용해 관련 조회를 무효화합니다. Suspense hook을 사용하는 화면에는 Suspense와 오류 경계를 연결합니다. 이 코드는 실제 서버를 호출하는 앱 코드이며 문서 화면에서 실행하지 않습니다.',
        code: true,
      },
      {
        title: '설정 후 기대효과',
        body: 'endpoint·method·요청 body·응답을 OpenAPI 타입으로 확인하고, token 전달과 서버 실패 판정을 화면마다 반복하지 않게 됩니다. 같은 QueryClient와 query key를 쓰는 조회는 캐시를 공유합니다. 예제의 staleTime 30초는 그동안 데이터를 fresh로 취급하는 설정이며, 30초마다 자동 조회하는 timer가 아닙니다. 캐시 key에는 조회 조건과 언어 등 결과에 영향을 주는 값을 포함해야 합니다.',
      },
      {
        title: '오류 표시와 성공 판정',
        body: 'responseMode의 기본값은 owp입니다. successResultCode를 지정하면 기본 query·Suspense query·queryOptions와 자동 mutation은 HTTP 성공과 resultCode의 정확한 문자열 일치를 함께 요구합니다. STATUS_0의 유효한 resultMessage는 공백과 줄바꿈을 포함한 원문을 오류로 전달하고, 그 외 알 수 없는 코드는 결과를 다시 확인하라는 안내로 실패합니다. isErrorMessageEnabled=false는 공통 안내만 끄며 실패 전파와 자동 인증 오류 처리는 유지합니다. isServerMessageEnabled=false는 mutation의 성공 안내만 끕니다.',
      },
      {
        title: 'resultCode가 없는 객체 허용',
        body: 'allowMissingResultCode는 useApiQuery·useApiSuspenseQuery·queryOptions·useApiMutation이 지원하며 기본 false입니다. true이면 HTTP 2xx의 비배열 객체에 resultCode 자체 필드가 없을 때만 성공 코드 검사를 생략하고 body 전체를 반환합니다. {}와 { resultData: [] }도 정상 객체입니다. resultCode가 null·빈 문자열·실패 코드이면 검사를 유지하며 배열·primitive·null·잘못된 JSON에는 적용되지 않습니다. 이 옵션은 resultData만 꺼내는 변환 기능이 아닙니다.',
      },
      {
        title: '파싱한 JSON body를 반환하는 raw 모드',
        body: 'responseMode: "raw"는 HTTP 2xx의 파싱한 JSON body를 false·0·빈 문자열·null·배열·객체 그대로 반환하며 빈 HTTP 200·204 body는 null로 정규화합니다. JSON 문자열을 담은 원본 text를 반환하는 옵션이 아닙니다. init의 parseAs는 생략하거나 json만 지정하며 text·blob·stream·arrayBuffer와 함께 사용하지 않습니다. 업무 코드·인증 오류 검사와 mutation 성공 snackbar는 생략합니다. raw에서는 allowMissingResultCode 값도 무시합니다. HTTP·network 오류 안내와 취소 시 무알림, 원본 fetch 오류 전달, Inspector 기록은 기존 정책을 따릅니다.',
      },
      {
        title: '응답 정책별 캐시와 무효화',
        body: '기본 OWP key는 [method, path, init]입니다. raw는 네 번째 요소로 { owpResponsePolicy: { responseMode: "raw" } }를, 누락 허용은 { owpResponsePolicy: { responseMode: "owp", allowMissingResultCode: true } }를 추가해 캐시를 분리합니다. 명시적 owp·false는 기본 key와 같고 raw의 누락 허용 값은 key에 영향을 주지 않습니다. 이 구조는 계약 설명이며 앱에서는 queryOptions가 생성한 queryKey를 그대로 재사용합니다. 기본 3개 요소의 key로 invalidateQueries를 실행하면 같은 init의 정책별 캐시도 무효화합니다. exact: true는 지정한 정책의 key만 무효화합니다.',
      },
      {
        title: '응답 타입과 기존 generic',
        body: 'OpenAPI paths로 추론한 응답은 body 전체 타입을 사용합니다. 기존 query·Suspense hook의 <Row>는 OwpApiListResponse<Row>, <Row, "single">은 OwpApiSingleResponse<Row>를 유지하고 mutation의 <Row>도 OwpApiMutationResponse<Row>를 유지합니다. raw 요청의 <Body>는 row가 아니라 body 전체 타입이며 결과는 Body의 undefined를 null로 정규화한 타입입니다. 일반 query·mutation의 초기 data에는 undefined가 추가될 수 있습니다. raw queryOptions<Body>의 queryFn과 fetchQuery 결과도 같은 body·null 계약을 따릅니다. allowMissingResultCode가 응답을 변환하거나 선언 타입을 자동으로 느슨하게 만들지는 않습니다.',
      },
      {
        title: '수동 mutation의 판정과 표시 옵션',
        body: 'isServerErrorMessageEnabled=false는 HTTP 성공 응답의 result와 인증 오류 판정을 호출부에 맡기는 별도 수동 모드이며 allowMissingResultCode로 그 책임이 바뀌지 않습니다. OWP 모드에서 이 모드의 onSuccess만으로 업무 성공을 판단하지 말고 응답과 인증 오류를 직접 확인해야 합니다. isServerMessageEnabled=false는 성공 snackbar만 끄는 별도 옵션입니다. HTTP·network 실패는 여전히 reject하며, 수동 mutation에서는 공통 오류 안내와 자동 인증 처리를 생략합니다. raw의 HTTP 성공은 응답 정책에 따라 검사와 성공 snackbar를 생략합니다.',
      },
      {
        title: 'HTTP 오류와 인증 오류',
        body: 'HTTP 실패는 status·statusText·responseData를 가진 Error로 전달합니다. STATUS_0의 비어 있지 않은 resultMessage를 표시 메시지로 우선하고, 그 외에는 trace와 message, resultMessage, HTTP 상태 순으로 사용합니다. 인증 판별은 표시 메시지와 별도로 원본 trace와 message를 우선하므로 표시할 오류 문구가 달라도 authErrors가 일치할 수 있습니다. 자동 처리에서는 인증 오류에 snackbar 대신 onAuthError를 실행합니다. 수동 mutation에서는 HTTP 실패도 reject하지만 공통 안내와 자동 인증 처리는 실행하지 않습니다.',
      },
      {
        title: '연결 실패와 요청 취소',
        body: '응답을 받지 못한 fetch 실패는 원본 오류 객체를 그대로 reject하고 onAuthError를 실행하지 않습니다. isErrorMessageEnabled와 mutation의 isServerErrorMessageEnabled가 모두 true일 때 연결 상태와 처리 결과를 확인하라는 공통 snackbar를 표시합니다. query에는 factory의 안내 옵션이 적용됩니다. AbortSignal이 이미 취소됐거나 오류 이름이 AbortError이면 이 안내를 생략합니다. Inspector를 활성화하면 실패와 취소 요청도 기록합니다. query는 QueryClient의 취소와 연결되며 mutation을 취소하려면 호출부가 AbortSignal을 전달해야 합니다. 취소가 서버의 저장 결과를 되돌리지는 않으므로 재시도 전에 결과를 확인합니다.',
      },
      {
        title: '앱 구성과 동작 확인',
        body: '앱 구성 예시의 src/api/index.ts는 createOwpApiHooks<paths>로 API hook을 export하고 인증 오류의 로그인 이동을 연결합니다. Provider에서는 retry·focus 재조회 기본값을 지정합니다. Playground의 API 요청에서 Query와 GET mutation으로 OWP 응답·코드 누락·명시적 null 코드·배열·인증 오류와 HTTP 404를 비교합니다. raw 응답 유형은 false·0·빈 문자열·null·배열·빈 객체·일반 객체의 JSON 값을 비교합니다. Query도 누락 허용을 선택할 수 있고, 인증 callback은 이벤트 탭에 기록합니다. 로컬 응답을 조회하며 실제 로그인이나 서버 저장은 수행하지 않습니다. 실제 앱에서는 연결 실패·저장 성공 후 재조회·화면 이동 시 요청 취소도 확인합니다.',
      },
    ],
  },
  {
    id: 'theme-settings',
    knowledgeId: '@owp/core:guide.theme',
    title: '테마와 설정',
    introduction:
      'Core settings는 앱 레이아웃·동작과 main·navbar·toolbar·footer의 테마를 함께 관리합니다. 기본값은 OwpCoreProvider의 configs.settingsConfig에서 정하고 OwpStyleProvider로 화면에 적용합니다.',
    sections: [
      {
        title: '초기 설정과 테마의 범위',
        body: 'settingsConfig에 direction·customScrollbars와 각 영역의 theme을 지정합니다. main.palette는 MUI 색상을, main.table·main.dataGrid는 OWP의 별도 공개 테마를 설정합니다. Core theme 입력은 MUI ThemeOptions 전체가 아니므로 typography 같은 임의 옵션을 넣지 않습니다. main palette만 바꾼다고 모든 명시적 table·DataGrid 색이 함께 바뀌지는 않으므로 앱의 토큰을 각 설정에 연결합니다. navbar·toolbar·footer는 해당 영역을 사용하는 레이아웃과 style provider에 연결됩니다.',
      },
      {
        title: '설정 방법',
        body: '아래 settingsConfig를 기존 Provider의 configs.settingsConfig에 전달합니다. setMainMode는 현재 설정만 변경하고, applyCurrentThemeAsDefault는 현재 테마와 함께 layout·customScrollbars 등 현재의 비테마 설정도 기본값에 반영합니다. Core가 생성하는 MUI 테마는 htmlFontSize=10을 사용합니다. 별도 MUI theme을 직접 만들 때도 Core CSS의 html 10px rem 기준과 typography.htmlFontSize=10을 맞춥니다.',
        code: true,
      },
      {
        title: '설정 후 기대효과',
        body: '같은 store를 읽는 화면이 현재 테마와 설정 변경에 반응합니다. 공통 색·글자 크기·테이블 설정을 앱 수준에서 관리해 페이지마다 같은 스타일을 반복 정의할 필요가 줄어듭니다. OwpStyleProvider에 명시적인 theme을 전달한 영역은 그 theme을 우선 사용합니다. 실행 예제의 앱 설정에서 설정 변경 후 Table·FieldTable 반영을 확인할 수 있습니다.',
      },
      {
        title: '현재 설정·기본 설정·초기화',
        body: 'useGetCurrentSettings는 현재값을, useGetDefaultSettings는 기본값을 읽습니다. useSetSettings는 전달한 설정을 기본 설정과 병합해 현재값으로 반영하므로 기존 현재값도 유지하려면 예제처럼 펼쳐서 전달합니다. Core 10.2.0의 useChangeOwpTheme는 기본·현재 테마를 바꾸면서 layout·customScrollbars 등 현재의 비테마 설정도 기본값에 반영합니다. useResetSettings는 현재값을 그 시점의 기본값으로 돌리며, 테마 변경 전 값이나 최초 설치 상태로 돌아가는 기능은 아닙니다.',
      },
      {
        title: '앱 구성과 설정 저장',
        body: '앱 구성 예시의 src/configs/theme/settings.ts는 팔레트·table·dataGrid·snackbar 설정을 조합하고 AppProviders에서 전달합니다. getResolvedThemePreviewSettingsConfig는 별도로 저장한 테마 미리보기 설정을 시작 설정에 반영하는 선택적 연결이며 일반 settings의 자동 저장을 뜻하지 않습니다. 사용자 설정을 보존하려면 앱이 저장할 필드와 사용자별 저장 위치를 정하고, 저장 데이터를 검증한 뒤 기본 설정 초기화 이후 useSetSettings로 복원합니다.',
      },
    ],
  },
] as const;
