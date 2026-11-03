export const interfaceKorean: Readonly<Record<string, string>> = {
  '사이트 화면 테마 전환': '화면 테마 전환',
  '관련 실행 예제': '관련 예제',
  'API 검색·목록': 'API 목록',
  '연결된 API 사용 위치 강조': 'API 사용 위치 강조',
  '설치 및 사용 안내': '설치와 사용법',
  '그리드와 조작 영역': 'Grid와 조작 패널',
  '그리드 세부 설정': 'DataGrid 설정',
  '상세 테마 편집': '테마 편집기 열기',
  '모서리 둥글기': 'radius',
  '기존 settingsConfig에 themeOverrides를 병합하고 OwpCoreProvider에 전달합니다. 모서리 둥글기는 DataGrid의 radius 속성에 적용합니다.':
    '기존 settingsConfig에 themeOverrides를 병합하고 OwpCoreProvider에 전달합니다. DataGrid의 radius 값으로 모서리가 둥근 정도를 설정합니다.',
  '파일 하나·이미지 여러 개 선택과 비활성 버튼을 비교합니다.':
    '파일 한 개 선택, 이미지 여러 개 선택, 버튼 비활성화 상태를 비교합니다.',
  '하위 화면을 늦게 표시하거나 바로 표시하고, resetKey로 초기화합니다.':
    '하위 컴포넌트의 mount를 지연하거나 즉시 실행하고, resetKey로 초기화합니다.',
  '입력란 늦게 표시하기': '입력 컴포넌트의 mount 지연',
  '입력란 바로 표시하기': '입력 컴포넌트 즉시 mount',
  'defer를 켜면 입력란을 바로 만들지 않고 공통 대기열에서 나누어 준비합니다.':
    'defer를 켜면 입력 컴포넌트의 mount를 공통 batch queue에서 처리합니다.',
  'defer를 끄면 대기열을 거치지 않고 입력란을 바로 만듭니다.':
    'defer를 끄면 batch queue를 거치지 않고 입력 컴포넌트를 즉시 mount합니다.',
  '아래 Paths는 설명용 최소 OpenAPI 타입입니다. 실제 앱에서는 생성한 paths와 서버의 endpoint·응답 구조·인증 오류 메시지로 교체합니다. useApiQuery·useApiSuspenseQuery는 조회하고, queryOptions는 QueryClient의 fetchQuery·prefetchQuery에 전달할 설정을 만듭니다. useApiMutation은 호출 시 요청을 실행합니다. 저장 성공 후 생성된 queryKey를 재사용해 관련 조회를 무효화합니다. Suspense hook을 사용하는 화면에는 Suspense와 오류 경계를 연결합니다. 이 코드는 실제 서버를 호출하는 앱 코드이며 문서 화면에서 실행하지 않습니다.':
    '예제의 Paths는 설명에 필요한 최소 OpenAPI 타입입니다. 실제 앱에서는 생성한 paths와 서버의 endpoint·응답 구조·인증 오류 메시지를 사용합니다. useApiQuery·useApiSuspenseQuery는 데이터를 조회하고, queryOptions는 QueryClient의 fetchQuery·prefetchQuery에 전달할 설정을 만듭니다. useApiMutation은 호출할 때 요청을 실행합니다. 저장 성공 후에는 생성된 queryKey를 재사용해 관련 조회를 무효화합니다. Suspense Hook을 사용하는 화면에는 Suspense와 Error Boundary를 함께 사용합니다. 이 코드는 실제 서버를 호출하는 앱 코드이며 문서 화면에서 실행하지 않습니다.',
  'responseMode의 기본값은 owp입니다. successResultCode를 지정하면 기본 query·Suspense query·queryOptions와 자동 mutation은 HTTP 성공과 resultCode의 정확한 문자열 일치를 함께 요구합니다. STATUS_0의 유효한 resultMessage는 공백과 줄바꿈을 포함한 원문을 오류로 전달하고, 그 외 알 수 없는 코드이면 결과를 다시 확인하라는 오류를 발생시킵니다. isErrorMessageEnabled=false는 공통 안내만 끄며 실패 전파와 자동 인증 오류 처리는 유지합니다. isServerMessageEnabled=false는 mutation의 성공 안내만 끕니다.':
    'responseMode의 기본값은 owp입니다. successResultCode를 지정하면 기본 query·Suspense query·queryOptions와 자동 mutation은 HTTP 요청이 성공하고 resultCode 문자열도 정확히 일치해야 성공으로 처리합니다. STATUS_0의 유효한 resultMessage는 공백과 줄바꿈을 포함한 원문을 오류로 전달합니다. 그 외 알 수 없는 코드이면 결과를 다시 확인하라는 오류를 발생시킵니다. isErrorMessageEnabled=false는 공통 오류 안내만 끕니다. 오류를 호출부에 전달하는 동작과 자동 인증 오류 처리는 유지합니다. isServerMessageEnabled=false는 mutation의 성공 안내만 끕니다.',
  'createOwpApiHooks는 API 접속 정보와 응답·인증 오류 정책을 한 번 설정해 조회와 저장 hook을 만듭니다. OwpCoreProvider의 QueryClient는 이 hook들이 사용하는 요청 캐시와 재시도 기본값을 제공합니다.':
    'createOwpApiHooks로 API 접속 정보와 응답·인증 오류 처리 방식을 설정해 조회·저장용 Hook을 만듭니다. OwpCoreProvider의 QueryClient는 이 Hook들이 사용하는 요청 cache와 재시도 기본값을 제공합니다.',
  '일반 글자 굵기': '글자 굵기 (regular)',
  '중간 글자 굵기': '글자 굵기 (medium)',
  'Bold 글자 굵기': '글자 굵기 (bold)',
  '기본값을 가진 바코드': '바코드 초기값',
  '현재 변경 상태 조회': '현재 변경 내용 확인',
  '호출부 직접 판정': '응답 직접 검사',
  '수동 mutation의 판정과 표시 옵션': '수동 mutation의 응답 검사와 알림 설정',
  '응답 정책별 캐시와 무효화': '응답 처리 방식별 캐시와 무효화',
  '패키지별 기능 연결': '패키지별 연동 방법',
  '메모리 Jotai 상태 (자동 저장 없음)': 'Jotai store 상태 (자동 저장 없음)',
  'Core 실행 영역': 'Core 예제',
  'Components 실행 영역': 'Components 예제',
  '기본 최소 시간': '기본 최소 표시 시간',
  '측정 중지와 한 줄 기본값': '측정 중지: 한 줄로 처리',
  '측정 중지와 줄바꿈 기본값': '측정 중지: 줄바꿈으로 처리',
  '입력에 포커스': '입력란에 포커스',
  '입력에 포커스를 두고 Enter를 누르세요.': '입력란에 포커스를 맞춘 뒤 Enter를 누르세요.',
  '전체 옵션 없이 하나의 상태를 선택합니다.': '‘전체’ 항목 없이 하나의 상태를 선택합니다.',
  'Text 입력 정책': '텍스트 입력 규칙',
  '빈 값은 입력 정책에서 허용합니다. 필수 입력은 별도로 검사합니다.':
    '입력 규칙은 빈 값을 허용합니다. 필수 입력 여부는 별도로 검사합니다.',
  '입력 정책 비교용 외부 오류입니다.': '입력 규칙을 비교하기 위한 외부 오류입니다.',
  '외부 오류를 모두 해제했습니다. intrinsic 검증 오류는 유지됩니다.':
    '외부 오류를 모두 해제했습니다. Grid 자체 검증으로 발생한 오류는 유지됩니다.',
  'MCP는 지원이 완료된 패키지의 공개 API·가이드·실행 예제를 제공합니다. AI가 설치 버전에 맞는 설정과 사용 방법을 같은 스냅샷에서 확인할 수 있습니다.':
    'MCP는 지원하는 패키지의 API 문서·가이드·예제를 제공합니다. AI는 설치된 패키지 버전에 맞는 자료를 같은 스냅샷에서 조회할 수 있습니다.',
  '<OWP_MCP_URL>에 팀 공용 서버의 기본 주소를 입력합니다. /mcp는 MCP 연결 경로입니다. 주소·인증·접근 권한은 Impix SmartBiz 팀에 확인해 주세요.':
    '<OWP_MCP_URL>에 서버의 기본 주소를 입력합니다. /mcp는 MCP 연결 경로입니다. 서버 주소와 인증·접근 권한은 Impix SmartBiz 팀에 확인해 주세요.',
  '연결 정보를 등록한 뒤 아래 예시로 요청합니다. 예시는 Playground에 설치된 정확한 패키지 버전을 사용하므로, 프로젝트의 설치 버전이 다르면 해당 버전으로 바꾸어 요청하세요.':
    '서버를 연결한 뒤 아래 프롬프트로 요청하세요. 예시의 패키지 버전은 Playground 설치 버전입니다. 프로젝트에서 다른 버전을 사용한다면 버전을 바꿔 요청하세요.',
  '공개 API의 타입과 동작을 살펴보고 사용 예제를 확인합니다.':
    'API의 타입·동작·사용 예제를 확인합니다.',
  '하위 페이지에서 같은 사용자·설정 상태와 요청 캐시를 읽고, Core 테마와 공통 dialog·loading 정책을 사용할 수 있습니다. query 취소와 페이지 이탈 확인을 페이지마다 새로 조합할 필요가 줄어듭니다. 미저장 변경 감지는 페이지가 isDirty를 제공해야 하고, 취소는 연결된 query와 AbortSignal을 따르므로 서버 저장을 되돌리는 기능은 아닙니다.':
    '하위 페이지는 사용자 정보·앱 설정·요청 cache를 공유하고 Core 테마·다이얼로그·로딩 기능을 사용할 수 있습니다. query 취소와 페이지 이동 확인을 페이지마다 따로 구현할 필요가 줄어듭니다. 저장하지 않은 변경 내용을 감지하려면 페이지에서 isDirty를 제공해야 합니다. 요청 취소는 연결된 query와 AbortSignal을 따르며, 서버에 저장된 결과를 되돌리지는 않습니다.',
  'API hook과 QueryClient를 설정해 요청 정책과 조회 캐시를 앱 전체에서 공유합니다.':
    'API Hook과 QueryClient로 요청 처리 설정과 조회 cache를 앱 전체에서 공유합니다.',
  '참조 프로젝트의 AppProviders·App·api/index.ts·configs/theme/settings.ts 구성을 기준으로 업무별 값은 줄이고 공통 연결 방법을 설명합니다. 실행 예제에서는 API 응답·권한·설정·페이지 정책의 실제 변화를 확인합니다.':
    '참조 프로젝트의 AppProviders·App·api/index.ts·configs/theme/settings.ts에서 업무별 설정을 줄여 앱 연동 방법을 설명합니다. 예제에서 API 응답·권한·앱 설정과 Core UI의 동작을 확인할 수 있습니다.',
  '공통 UI는 Components가 제공하고, Core는 그 UI에 앱 설정·인증·페이지 이탈·요청 취소 같은 정책을 연결합니다. 각 기능을 연결할 때는 이미 적용된 <strong>정책을 중복 연결하지 않습니다</strong>.':
    '공통 UI는 Components에서 가져옵니다. Core는 앱 설정·인증·페이지 이동 확인·요청 취소 기능을 공통 UI와 연동합니다. <strong>이미 적용된 처리를 중복으로 연결하지 않습니다</strong>.',
  '일반 오류 UI는 Components OwpErrorBoundary를, chunk 복구는 Utils를 사용합니다. Core OwpRouteErrorElement는 Data Router 오류를 해석합니다.':
    'render 오류는 Components의 OwpErrorBoundary로 처리하고, 동적 import 실패 시 복구에는 Utils를 사용합니다. Data Router 오류는 Core의 OwpRouteErrorElement로 처리합니다.',
  '파일 업로드 hook의 FormData 구성과 요청 변수 연결을 확인합니다.':
    '파일 업로드 Hook으로 FormData를 만들고 API 요청에 전달하는 방법을 확인합니다.',
  '실제 업로드는 mutation을 앱의 API mutation으로 교체하고, createVariables에서 formData를 해당 API의 요청 변수에 연결합니다.':
    '실제 파일을 업로드하려면 예제의 mutation을 앱의 API mutation으로 교체합니다. createVariables에서 formData를 해당 API의 요청 변수로 전달하세요.',
};
