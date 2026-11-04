export const guidanceKorean: Readonly<Record<string, string>> = {
  '사용하는 앱의 MCP 설정에 아래 서버 정보를 등록합니다. 설정 위치와 형식은 앱마다 다릅니다.':
    '사용하는 앱의 MCP 설정에 아래 서버 정보를 등록해 주세요. 설정 위치와 형식은 앱마다 다릅니다.',
  '<OWP_MCP_URL>에 팀 공용 서버의 기본 주소를 입력합니다. /mcp는 MCP 연결 경로입니다. 주소·인증·접근 권한은 Impix SmartBiz 팀에 확인해 주세요.':
    '<OWP_MCP_URL>에 서버의 기본 주소를 입력해 주세요. /mcp는 MCP 연결 경로입니다. 서버 주소와 인증·접근 권한은 Impix SmartBiz 팀에 확인해 주세요.',
  '연결 후 list_packages로 제공되는 패키지와 버전을 먼저 확인하세요. Playground의 API 목록과 MCP 서버에 등록된 자료는 다를 수 있습니다. 요청한 자료가 없으면 설치본의 공개 타입과 README를 기준으로 확인합니다.':
    'MCP에서 조회할 수 있는 패키지와 버전은 list_packages로 확인합니다. Playground의 API 목록과 MCP 서버의 자료는 다를 수 있습니다. 필요한 자료가 없으면 설치된 패키지의 공개 타입과 README를 참고합니다.',
  'OWP에서 wrapper 컴포넌트·Hook·함수를 제공하는 경우에는 원본 API나 re-export 대신 해당 wrapper를 사용해 주세요. 번역 기능을 구현할 때는 @owp/components/hooks의 useOwpTranslation을, API 요청을 구현할 때는 @owp/core/hooks의 createOwpApiHooks를 먼저 확인해 주세요.':
    'OWP에서 제공하는 wrapper API를 우선 사용합니다. 다국어 처리에는 @owp/components/hooks의 useOwpTranslation을 사용합니다. API 요청은 @owp/core/hooks의 createOwpApiHooks로 구현합니다.',
  '응답의 packageVersion이 요청한 버전과 일치하는지 확인하세요. 후속 조회에서도 같은 version과 releaseId를 사용하면 서로 다른 배포 버전의 자료가 섞이지 않습니다.':
    '응답의 packageVersion이 요청한 버전과 일치하는지 확인. 후속 조회에는 같은 version과 releaseId 사용.',
  '프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.':
    '프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정해 주세요.',
  'API 목록에서 사용할 항목을 선택하면 공개 import 경로, 타입과 사용 코드를 확인할 수 있습니다.':
    'API 목록에서 항목을 선택해 공개 import 경로와 타입, 사용 코드를 확인해 주세요.',
  '공개 API의 타입과 동작을 살펴보고 사용 예제를 확인합니다.':
    'API의 타입·동작·사용 예제를 확인해 주세요.',
  'Components가 제공하는 컴포넌트·Hooks·Utils의 API를 검색하고 확인합니다.':
    'Components가 제공하는 컴포넌트·Hooks·Utils의 API를 검색하고 사용법을 확인해 주세요.',
  'Core가 직접 구현한 기능을 역할별로 정리했습니다. 각 기능의 설정 방법과 기대효과를 확인하고 문서·실행 예제·공개 API로 이동할 수 있습니다.':
    'Core의 기능별 사용법과 설정을 확인해 주세요. 각 항목에서 가이드·예제·API 문서로 이동할 수 있습니다.',
  'Core의 앱 기능과 Components·Theme·Excel·Utils의 공개 API를 필요한 위치에 직접 연결합니다. 공통 UI의 동작과 타입은 소유 패키지에서 확인합니다.':
    'Core의 앱 기능과 Components·Theme·Excel·Utils의 공개 API를 필요한 위치에 직접 연결해 주세요. 공통 UI의 동작과 타입은 해당 UI를 제공하는 패키지에서 확인해 주세요.',
  '실제 업로드는 mutation을 앱의 API mutation으로 교체하고, createVariables에서 formData를 해당 API의 요청 변수에 연결합니다.':
    '실제 파일을 업로드하려면 예제의 mutation을 앱의 API mutation으로 교체해 주세요. createVariables에서 formData를 해당 API의 요청 변수로 전달해 주세요.',
  '응답을 받지 못한 fetch 실패는 원본 오류 객체를 그대로 reject하고 onAuthError를 실행하지 않습니다. isErrorMessageEnabled와 mutation의 isServerErrorMessageEnabled가 모두 true일 때 연결 상태와 처리 결과를 확인하라는 공통 snackbar를 표시합니다. query에는 factory의 안내 옵션이 적용됩니다. AbortSignal이 이미 취소됐거나 오류 이름이 AbortError이면 이 안내를 생략합니다. Inspector를 활성화하면 실패와 취소 요청도 기록합니다. query는 QueryClient의 취소와 연결되며 mutation을 취소하려면 호출부가 AbortSignal을 전달해야 합니다. 취소가 서버의 저장 결과를 되돌리지는 않으므로 재시도 전에 결과를 확인합니다.':
    '응답을 받지 못한 fetch 실패는 원본 오류 객체를 그대로 reject하고 onAuthError를 실행하지 않습니다. isErrorMessageEnabled와 mutation의 isServerErrorMessageEnabled가 모두 true일 때 연결 상태와 처리 결과를 확인하라는 공통 snackbar를 표시합니다. query에는 factory의 안내 옵션이 적용됩니다. AbortSignal이 이미 취소됐거나 오류 이름이 AbortError이면 이 안내를 생략합니다. Inspector를 활성화하면 실패와 취소 요청도 기록합니다. query는 QueryClient의 취소와 연결되며 mutation을 취소하려면 호출부가 AbortSignal을 전달해야 합니다. 취소가 서버의 저장 결과를 되돌리지는 않으므로 재시도 전에 결과를 확인해 주세요.',
  '앱 구성 예시의 src/api/index.ts는 createOwpApiHooks<paths>로 API hook을 export하고 인증 오류의 로그인 이동을 연결합니다. Provider에서는 retry·focus 재조회 기본값을 지정합니다. Playground의 API 요청은 로컬 JSON으로 정상·빈 목록·실패를 확인하며, 실제 로그인·서버 저장·OpenAPI 생성 작업은 수행하지 않습니다. 실제 앱에서는 저장 성공 후 재조회와 화면 이동 시 요청 취소도 확인합니다.':
    '앱 구성 예시의 src/api/index.ts는 createOwpApiHooks<paths>로 API Hook을 export하고 인증 오류의 로그인 이동을 연결합니다. Provider에서는 retry·focus 재조회 기본값을 지정합니다. Playground의 API 요청은 로컬 JSON으로 정상·빈 목록·실패를 확인하며, 실제 로그인·서버 저장·OpenAPI 생성 작업은 수행하지 않습니다. 실제 앱에서는 저장 성공 후 재조회와 화면 이동 시 요청 취소도 확인해 주세요.',
  '앱 구성 예시의 src/api/index.ts는 createOwpApiHooks<paths>로 API hook을 export하고 인증 오류의 로그인 이동을 연결합니다. Provider에서는 retry·focus 재조회 기본값을 지정합니다. Playground의 API 요청에서 Query와 GET mutation으로 OWP 응답·코드 누락·명시적 null 코드·배열·인증 오류와 HTTP 404를 비교합니다. raw 응답 유형은 false·0·빈 문자열·null·배열·빈 객체·일반 객체의 JSON 값을 비교합니다. Query도 누락 허용을 선택할 수 있고, 인증 callback은 이벤트 탭에 기록합니다. 로컬 응답을 조회하며 실제 로그인이나 서버 저장은 수행하지 않습니다. 실제 앱에서는 연결 실패·저장 성공 후 재조회·화면 이동 시 요청 취소도 확인합니다.':
    '앱 구성 예시의 src/api/index.ts는 createOwpApiHooks<paths>로 API Hook을 export하고 인증 오류의 로그인 이동을 연결합니다. Provider에서는 retry·focus 재조회 기본값을 지정합니다. Playground의 API 요청에서 Query와 GET mutation으로 OWP 응답·코드 누락·명시적 null 코드·배열·인증 오류와 HTTP 404를 비교합니다. raw 응답 유형은 false·0·빈 문자열·null·배열·빈 객체·일반 객체의 JSON 값을 비교합니다. Query도 누락 허용을 선택할 수 있고, 인증 callback은 이벤트 탭에 기록합니다. 로컬 응답을 조회하며 실제 로그인이나 서버 저장은 수행하지 않습니다. 실제 앱에서는 연결 실패·저장 성공 후 재조회·화면 이동 시 요청 취소도 확인해 주세요.',
  '3~10월에 포인터를 올려 두 차트의 동기화를 확인합니다.':
    '3~10월에 포인터를 올려 두 차트의 동기화를 확인해 주세요.',
  '같은 월 label을 기준으로 연결합니다. 서로 겹치는 월에서 포인터와 확대 범위를 확인합니다.':
    '같은 월 label을 기준으로 연결합니다. 서로 겹치는 월에서 포인터와 확대 범위를 확인해 주세요.',
  '응답 유형을 고른 뒤 조회 버튼으로 결과를 확인합니다.':
    '응답 유형을 선택한 뒤 조회 버튼을 눌러 결과를 확인해 주세요.',
  '조회 버튼으로 mock 응답을 요청합니다.': '조회 버튼을 눌러 mock 응답을 요청해 주세요.',
  '작업 시간과 최소 표시 시간에 따른 처리 중 안내를 비교합니다.':
    '작업 시간과 최소 표시 시간이 다른 예제를 실행해 처리 중 안내를 비교해 주세요.',
  '알림창·확인창·직접 만든 다이얼로그를 열고 사용자의 응답을 확인합니다.':
    '알림창·확인창·직접 만든 다이얼로그를 열어 사용자의 응답을 확인해 주세요.',
  '안내·저장·수정·삭제에 맞는 확인창을 비교합니다.':
    '안내·저장·수정·삭제에 맞는 확인창의 문구와 버튼을 비교해 주세요.',
  '제목·보조 정보·버튼이 헤더 한 줄에 들어가는지 확인합니다.':
    '제목·보조 정보·버튼이 헤더 한 줄에 들어가는지 확인해 주세요.',
  '브라우저 너비에 따라 달라지는 화면 크기 구분을 확인합니다.':
    '브라우저 너비를 바꿔 화면 크기 구분이 어떻게 달라지는지 확인해 주세요.',
  'lg 미만에서 표 최소 너비와 가로 스크롤을 확인합니다.':
    'lg 미만에서 표의 최소 너비와 가로 스크롤을 확인해 주세요.',
  'viewport에 따른 차트 프레임 높이와 overflow 동작을 비교합니다.':
    'viewport에 따른 차트 프레임 높이와 overflow 동작을 비교해 주세요.',
  '각 확인창의 기본 문구와 버튼 색상을 비교합니다.':
    '각 확인창의 기본 문구와 버튼 색상을 비교해 주세요.',
  '오류 안내를 확인한 뒤 예제를 다시 시작해 정상 화면으로 돌아옵니다.':
    '오류 안내를 확인한 뒤 예제를 다시 시작해 정상 화면으로 돌아가 주세요.',
  '대상: {{packageName}} {{version}}\n- list_packages로 대상 패키지와 버전 제공 여부 확인.\n- 해당 버전의 공개 API·가이드·사용 예제를 조회해 구현.\n- OWP wrapper 컴포넌트·Hook·함수가 있으면 원본 API나 re-export보다 항상 우선. wrapper의 소유 패키지와 설치 버전도 확인.\n- 응답의 packageVersion 대조. 후속 조회에 같은 version과 releaseId 사용.\n- 요청한 버전·자료가 없으면 다른 버전으로 대체하지 않고 설치본의 공개 타입·README 확인.':
    '대상: {{packageName}} {{version}}\n- list_packages로 대상 패키지와 버전의 자료 제공 여부 확인.\n- 해당 버전의 public API·가이드·사용 예제를 참고해 구현.\n- OWP에서 제공하는 wrapper API를 우선 사용. 해당 API를 제공하는 패키지와 설치 버전 확인.\n- 응답의 packageVersion이 요청한 버전과 일치하는지 확인. 후속 조회에는 같은 version과 releaseId 사용.\n- 요청한 버전이나 자료가 없으면 다른 버전으로 대체하지 않고, 설치된 패키지의 public 타입과 README 참고.',
};
