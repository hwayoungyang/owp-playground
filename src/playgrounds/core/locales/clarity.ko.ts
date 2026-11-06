export const coreKoreanClarity: Readonly<Record<string, string>> = {
  'API 요청과 캐시': 'API 요청과 cache',
  '캐시를 사용하는 기본 Select': 'cache를 사용하는 기본 Select',
  '프로바이더 구성': 'Provider 구성',
  '렌더 오류 발생': 'render 오류 발생',
  '예제에서 의도적으로 발생시킨 렌더 오류입니다.':
    '예제에서 의도적으로 발생시킨 render 오류입니다.',
  '렌더링 오류와 Data Router의 라우트 오류를 처리하고 복구합니다.':
    'render 오류와 Data Router의 route 오류를 처리하고 복구합니다.',
  '메모리 Jotai 상태 (자동 저장 없음)': '메모리의 Jotai store (자동 저장 없음)',
  'Core provider의 설정을 읽고 변경해 공통 UI에 적용합니다.':
    'Core Provider의 설정을 읽고 변경해 공통 UI에 적용합니다.',
  'Core는 앱 설정·인증·라우팅·OWP API를, Components는 공통 UI와 Dialog 상태를 소유합니다. 공통 UI는 Components에서 직접 가져오며 Theme·Excel·Utils도 해당 패키지의 공개 API를 사용합니다.':
    'Core는 앱 설정·인증·라우팅·OWP API를 담당하고, Components는 공통 UI와 Dialog state를 관리합니다. 공통 UI는 Components에서 직접 가져옵니다. Theme·Excel·Utils의 기능도 각 패키지의 공개 API로 사용합니다.',
  '검색·페이지 UI는 Components에서, 페이지 이탈과 OWP query 진행은 Core에서 가져와 필요한 위치에 직접 연결합니다. wrapper나 policy re-export를 거치지 않습니다.':
    '검색·페이지 UI는 Components에서 가져옵니다. 페이지 이동 확인과 OWP query 진행을 처리하는 기능은 Core에서 가져와 필요한 위치에 직접 연결합니다. wrapper나 policy re-export를 거치지 않습니다.',
  'header·content·sidebar·스크롤·반응형 배치는 @owp/components가 처리합니다. 페이지 이동의 미저장 변경 확인은 Core usePageLeaveGuard에 dirty 상태를 전달합니다.':
    '@owp/components가 header·content·sidebar·스크롤·반응형 배치를 처리합니다. 저장하지 않은 변경 내용이 있을 때 페이지 이동을 확인하려면 Core의 usePageLeaveGuard에 dirty state를 전달합니다.',
  'Dialog UI·미저장 변경 확인·stack·lifecycle·포커스 복원은 @owp/components가 처리합니다. DialogProps는 @owp/components/types, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.':
    '@owp/components가 Dialog 표시, 저장하지 않은 변경 내용 확인, stack·lifecycle 관리와 포커스 복원을 처리합니다. DialogProps는 @owp/components/types에서, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.',
  '다이얼로그 표시·중첩·닫기와 포커스 복원은 Components가 처리합니다. 저장하지 않은 내용 확인도 같은 패키지를 사용합니다. DialogProps는 @owp/components/types, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.':
    'Components가 다이얼로그 표시·중첩·닫기와 포커스 복원을 처리합니다. 저장하지 않은 변경 내용을 확인할 때도 Components를 사용합니다. DialogProps는 @owp/components/types에서, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.',
  '값을 변경한 뒤 닫기 또는 ESC를 누르면 미저장 변경을 확인합니다. 저장은 이 예제의 로컬 상태를 갱신합니다.':
    '값을 변경한 뒤 닫기 또는 ESC를 누르면 저장하지 않은 변경 내용을 버릴지 확인합니다. 저장하면 이 예제의 로컬 state를 갱신합니다.',
  'useConfirm의 저장 확인 옵션을 같은 Dialog provider에서 실행합니다.':
    '같은 Dialog Provider에서 useConfirm의 저장 확인 옵션을 실행합니다.',
  '동적 import(청크)에 실패하면 sessionStorage 키를 기준으로 자동 새로고침을 한 번 시도합니다. 일반 렌더링 오류는 원인을 해결한 뒤 key를 바꿔 컴포넌트를 다시 마운트해 복구합니다.':
    '동적 import(chunk)에 실패하면 sessionStorage key를 기준으로 자동 새로고침을 한 번 시도합니다. 일반 render 오류는 원인을 해결한 뒤 key를 바꿔 컴포넌트를 remount해 복구합니다.',
  'scroll=normal로 바깥 페이지가 세로 스크롤을 소유합니다. 이 예제는 Data Router 이탈 보호를 사용하지 않습니다.':
    'scroll=normal로 설정해 바깥 페이지에서 세로로 스크롤합니다. 이 예제는 Data Router의 페이지 이동 보호 기능을 사용하지 않습니다.',
  '900ms 후 로컬 데이터를 조회합니다. 검색 버튼의 취소 동작은 진행 중인 타이머와 query를 함께 정리합니다.':
    '900ms 후 로컬 데이터를 조회합니다. 검색 버튼에서 취소하면 진행 중인 timer와 query를 함께 정리합니다.',
  '선택한 파일이 없습니다. 파일 선택 버튼으로 로컬 파일을 선택해 주세요.':
    '선택한 파일이 없습니다. 파일 선택 버튼으로 로컬 파일을 선택하세요.',
  '파일을 추가했습니다. 아래 표에서 FormData에 담긴 필드를 확인하세요.':
    '파일을 추가했습니다. 아래 표에 FormData에 담긴 필드를 표시합니다.',
  '추가 버튼을 눌러 선택한 파일의 FormData를 확인하세요.':
    '추가 버튼을 누르면 선택한 파일의 FormData를 표시합니다.',
  '파일을 선택한 뒤 추가 버튼을 눌러 주세요.': '파일을 선택한 뒤 추가 버튼을 누르세요.',
  '로컬 데이터와 header·column mapper로 실제 xlsx 파일을 만듭니다. 다운로드 완료 여부는 브라우저의 다운로드 목록에서 확인하세요.':
    '로컬 데이터와 header·column mapper로 실제 xlsx 파일을 만듭니다. 브라우저의 다운로드 목록에서 다운로드 완료 여부를 확인할 수 있습니다.',
  '페이지를 새로고침하지 않고 Core 선택값과 앱의 번역을 변경합니다. 상단 메뉴와 예제 문구도 함께 확인하세요.':
    '페이지를 새로고침하지 않고 Core 선택값과 앱의 번역을 변경합니다. 상단 메뉴와 예제 문구가 함께 바뀌는지도 확인하세요.',
  'endpoint·method·요청 body·응답을 OpenAPI 타입으로 확인하고, token 전달과 서버 실패 판정을 화면마다 반복하지 않게 됩니다. 같은 QueryClient와 query key를 쓰는 조회는 캐시를 공유합니다. 예제의 staleTime 30초는 그동안 데이터를 fresh로 취급하는 설정이며, 30초마다 자동 조회하는 timer가 아닙니다. 캐시 key에는 조회 조건과 언어 등 결과에 영향을 주는 값을 포함해야 합니다.':
    'OpenAPI 타입으로 endpoint·method·요청 body·응답을 확인할 수 있습니다. token 전달과 서버 응답의 실패 여부를 판정하는 코드를 화면마다 반복할 필요도 줄어듭니다. 같은 QueryClient와 query key를 쓰는 조회는 cache를 공유합니다. 예제의 staleTime 30초는 그동안 데이터를 fresh로 취급하는 설정이며, 30초마다 자동 조회하는 timer가 아닙니다. cache key에는 조회 조건과 언어 등 결과에 영향을 주는 값을 포함해야 합니다.',
  'providers의 app·store·query·styledEngine으로 내부 Provider를 선택합니다. 상위에서 제공하는 context를 재사용하려면 해당 항목을 false로 지정합니다. 제외한 Provider는 생성되지 않으므로 하위 컴포넌트에 필요한 context는 상위에서 제공해야 합니다.':
    'providers의 app·store·query·styledEngine으로 사용할 내부 Provider를 선택합니다. 상위에서 제공하는 context를 재사용하려면 해당 항목을 false로 지정합니다. 제외한 Provider는 생성되지 않으므로 하위 컴포넌트에 필요한 context는 상위에서 제공해야 합니다.',
  'providers의 cache·muiTheme·owpTheme·scrollbars로 내부 Provider를 선택합니다. false로 지정한 Provider는 생성하지 않습니다. 상위 테마·cache·스크롤바 context를 재사용할 때 해당 항목을 제외하며, 하위 컴포넌트가 요구하는 context는 유지해야 합니다.':
    'providers의 cache·muiTheme·owpTheme·scrollbars로 사용할 내부 Provider를 선택합니다. false로 지정한 Provider는 생성하지 않습니다. 상위의 테마·cache·스크롤바 context를 재사용하려면 해당 항목을 제외합니다. 이때도 하위 컴포넌트에 필요한 context는 유지해야 합니다.',
  'providers의 snackbar·dialogs·pageLeaveGuard로 내부 Provider를 선택합니다. false로 지정한 Provider는 생성하지 않고 상위 context를 그대로 사용합니다. 예를 들어 상위 dialog context를 재사용하려면 providers.dialogs를 false로 지정합니다.':
    'providers의 snackbar·dialogs·pageLeaveGuard로 사용할 내부 Provider를 선택합니다. false로 지정한 Provider는 생성하지 않고 상위 context를 그대로 사용합니다. 예를 들어 상위 dialog context를 재사용하려면 providers.dialogs를 false로 지정합니다.',
  'features의 accessTokenGuard·commonCodes·queryCancellation·dialogRouteSync·pageLockLoading·autoLogout으로 실행할 기능을 선택합니다. 생략하면 기존 env·실행 조건을 따르고, false로 지정하면 해당 runtime을 생성하지 않습니다.':
    'features의 accessTokenGuard·commonCodes·queryCancellation·dialogRouteSync·pageLockLoading·autoLogout으로 실행할 기능을 선택합니다. 값을 생략하면 기존 env와 실행 조건에 따라 동작합니다. false로 지정하면 해당 runtime을 생성하지 않습니다.',
  'remote를 생략하면 로컬 리소스만 사용합니다. 원격 리소스가 필요하면 remote에 API 주소·인증 방식·resource 조회 계약을 지정합니다. 초기화 중에는 fallback을 표시합니다. 초기화 실패로 사용할 리소스가 없으면 지정한 onError를 호출하고 render에서 오류를 throw하므로 상위에 오류 경계를 둡니다. 초기 설정 변경은 Provider를 remount해 적용합니다. I18nextProvider는 외부에서 초기화한 인스턴스를 전달하는 upstream API이며 OWP 초기화·언어 동기화를 대신하지 않습니다.':
    'remote를 생략하면 로컬 리소스만 사용합니다. 원격 리소스가 필요하면 remote에 API 주소·인증 방식·resource 조회 계약을 지정합니다. 초기화 중에는 fallback을 표시합니다. 초기화에 실패해 사용할 리소스가 없으면 지정한 onError를 호출하고 render에서 오류를 throw합니다. 이 오류를 처리하도록 상위에 오류 경계를 둡니다. 초기 설정을 변경하려면 Provider를 remount합니다. I18nextProvider는 외부에서 초기화한 인스턴스를 전달하는 upstream API이며 OWP 초기화·언어 동기화를 대신하지 않습니다.',
  '같은 store를 읽는 화면이 현재 테마와 설정 변경에 반응합니다. 공통 색·글자 크기·테이블 설정을 앱 수준에서 관리해 페이지마다 같은 스타일을 반복 정의할 필요가 줄어듭니다. OwpStyleProvider에 명시적인 theme을 전달한 영역은 그 theme을 우선 사용합니다. 실행 예제의 앱 설정에서 설정 변경 후 Table·FieldTable 반영을 확인할 수 있습니다.':
    '같은 store를 사용하는 화면에 현재 테마와 설정의 변경 내용이 반영됩니다. 공통 색·글자 크기·테이블 설정을 앱 수준에서 관리하면 페이지마다 같은 스타일을 반복 정의할 필요가 줄어듭니다. OwpStyleProvider에 명시적인 theme을 전달한 영역은 그 theme을 우선 사용합니다. 앱 설정 예제에서 설정을 변경해 Table·FieldTable에도 반영되는지 확인할 수 있습니다.',
  '기본 OWP key는 [method, path, init]입니다. raw는 네 번째 요소로 { owpResponsePolicy: { responseMode: "raw" } }를, 누락 허용은 { owpResponsePolicy: { responseMode: "owp", allowMissingResultCode: true } }를 추가해 캐시를 분리합니다. 명시적 owp·false는 기본 key와 같고 raw의 누락 허용 값은 key에 영향을 주지 않습니다. 이 구조는 계약 설명이며 앱에서는 queryOptions가 생성한 queryKey를 그대로 재사용합니다. 기본 3개 요소의 key로 invalidateQueries를 실행하면 같은 init의 정책별 캐시도 무효화합니다. exact: true는 지정한 정책의 key만 무효화합니다.':
    '기본 OWP key는 [method, path, init]입니다. raw는 네 번째 요소로 { owpResponsePolicy: { responseMode: "raw" } }를, 누락 허용은 { owpResponsePolicy: { responseMode: "owp", allowMissingResultCode: true } }를 추가해 cache를 분리합니다. owp·false를 명시해도 기본 key와 같으며, raw에서는 누락 허용 값이 key에 영향을 주지 않습니다. 이 설명은 key 구조를 이해하기 위한 것으로, 앱에서는 queryOptions가 생성한 queryKey를 그대로 재사용합니다. 기본 3개 요소의 key로 invalidateQueries를 실행하면 같은 init의 정책별 cache도 무효화합니다. exact: true는 지정한 정책의 key만 무효화합니다.',
};
