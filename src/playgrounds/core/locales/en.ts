import { basicEnglish } from './basic.en';
import { advancedEnglish } from './advanced.en';
import { sessionEnglish } from './session.en';
import { foundationEnglish } from './foundations.en';
import { ownershipEnglish } from './ownership.en';
import { apiInspectorEnglish } from './api-inspector.en';
import { addedFeaturesEnglish } from './added-features.en';
import { extensionsEnglish } from './extensions.en';

export const coreEnglish: Readonly<Record<string, string>> = {
  ...basicEnglish,
  ...advancedEnglish,
  ...sessionEnglish,
  ...foundationEnglish,
  ...ownershipEnglish,
  ...apiInspectorEnglish,
  ...addedFeaturesEnglish,
  ...extensionsEnglish,
  'Label.검색': 'Search',
  시작하기: 'Getting started',
  문서: 'Documentation',
  'API·데이터 연결': 'API & data connection',
  '앱 상태·설정': 'App state & settings',
  '전역 상태·복구': 'Global state & recovery',
  Hooks: 'Hooks',
  Utils: 'Utils',
  '앱 구성': 'App setup',
  '페이지 구성': 'Page layout',
  조회·선택: 'Search & selection',
  피드백: 'Feedback',
  파일: 'Files',
  '앱 설정': 'App settings',
  'API 요청': 'API requests',
  '검색과 페이지': 'Search & page layout',
  '페이지 콘텐츠': 'Page content',
  '검색 필터': 'Search filter',
  'API 선택': 'API selector',
  '공통코드 선택': 'Common code selectors',
  '다이얼로그 상태 관리': 'Dialog state management',
  '확인과 알림': 'Confirm & alert',
  '로딩 표시': 'Loading indicators',
  '오류와 복구': 'Errors & recovery',
  '언어 전환': 'Language switcher',
  'Excel 내보내기': 'Excel export',
  'Core 실행 영역': 'Core workspace',
  '예제 설정': 'Example settings',
  '예제의 현재 상태와 데이터를 표시합니다.': 'Current state and data from this example.',
  'Core provider의 설정을 읽고 변경해 공통 UI에 적용합니다.':
    'Read and update Core provider settings to configure shared UI components.',
  'Core 설정·테마를 읽고 변경하며 Table·FieldTable adapter 연결을 확인합니다.':
    'Read and update Core settings and themes, and verify the Table and FieldTable adapters.',
  'API hook으로 목록을 조회하고, 결과가 없는 경우와 오류를 처리합니다.':
    'Query a list with API hooks and handle no results and errors.',
  '검색 조건과 결과를 페이지의 header와 content로 구성합니다.':
    'Arrange search filters and results in the page header and content.',
  '검색 조건과 결과를 페이지의 header·content로 구성하고 페이지 이탈을 보호합니다.':
    'Arrange search filters and results in the page header and content, and guard against leaving with unsaved changes.',
  '제목·보조 영역·액션을 조합하고 로딩 상태와 반응형 배치를 확인합니다.':
    'Compose titles, slots and actions, then compare loading and responsive layouts.',
  '검색 조건을 입력해 조회하고 조건 초기화와 비동기 진행 상태를 확인합니다.':
    'Submit search criteria and try reset and asynchronous progress.',
  '검색 조건을 입력해 조회하고 조건 초기화와 비동기 진행·취소 상태를 확인합니다.':
    'Submit search criteria and verify reset, asynchronous progress, and cancellation.',
  '로컬 응답 데이터를 실제 API selector로 조회하고 선택 값을 확인합니다.':
    'Load a local response with the API selector and inspect the selected value.',
  '같은 공통코드 데이터를 Select와 Radio group으로 선택합니다.':
    'Select from the same common code data with Select and Radio group.',
  '다이얼로그를 열고 결과를 받아 저장하며 미저장 변경을 보호합니다.':
    'Open a dialog, save its returned value and protect unsaved changes.',
  '공통 dialog hook으로 확인·취소에 따른 상태 변화를 확인합니다.':
    'Use the shared dialog hook to compare confirm and cancel outcomes.',
  '로딩 indicator의 종류와 크기를 비교합니다.': 'Compare loading indicator styles and sizes.',
  '로딩 indicator 옵션과 화면 잠금 로딩 정책을 비교합니다.':
    'Compare loading indicator options and the page lock loading policy.',
  '오류 경계에서 렌더 오류를 처리하고 복구합니다.':
    'Catch a render error with an error boundary and restore the content.',
  '렌더 오류 경계와 Data Router 라우트 오류를 처리하고 복구합니다.':
    'Handle and recover from render error boundaries and Data Router route errors.',
  'Core 언어 선택으로 한국어·영어 표시를 전환합니다.':
    'Switch between Korean and English with the Core language selector.',
  '화면 데이터를 공통 Excel 버튼으로 파일에 저장합니다.':
    'Download the displayed data with the shared Excel export button.',
  '글자 크기 (px)': 'Font size (px)',
  'Core 설정을 변경하면 같은 store를 사용하는 테이블에 바로 반영됩니다.':
    'Changes to Core settings immediately update tables that share the same store.',
  '기본 테마': 'Default theme',
  '강조 헤더': 'Emphasized header',
  '테마 구성': 'Theme preset',
  '현재 설정 초기화': 'Reset current settings',
  'useSetSettings는 현재 설정을, useChangeOwpTheme는 기본·현재 테마를 메모리 store에서 갱신합니다. 설정 저장은 앱의 책임이며 useStorage는 앱 환경 조회·저장과 storage 초기화를 제공합니다.':
    'useSetSettings updates current settings, and useChangeOwpTheme updates default and current themes in memory. The app owns settings persistence; useStorage provides app environment access and storage reset.',
  '현재 글자 크기': 'Current font size',
  '기본 헤더 크기': 'Default header size',
  '저장소 경계': 'Storage boundary',
  '메모리 Jotai 상태 (자동 저장 없음)': 'In-memory Jotai state (no auto-persistence)',
  '설정 미리보기': 'Settings preview',
  개수: 'Count',
  조회: 'Fetch',
  '조회 버튼으로 mock 응답을 요청합니다.': 'Use the Fetch button to request a mock response.',
  '조회에 실패했습니다. 다시 시도해 주세요.': 'The request failed. Please try again.',
  '조회 버튼을 눌러 주세요.': 'Choose Fetch to load the data.',
  '검색 버튼을 눌러 주세요.': 'Choose Search to load the data.',
  '설치 및 사용 안내': 'Installation and usage guide',
  '앱 초기화부터 API 요청, 인증·라우팅, 설정과 공통 UI까지 연결하는 React 기반 패키지입니다.':
    'A React package that connects app initialization, API requests, authentication, routing, settings and shared UI.',
  'Core의 역할': 'What Core provides',
  'OwpCoreProvider가 앱 환경·설정·상태·QueryClient를 구성합니다. OwpStyleProvider는 테마를 적용하고, OwpUiProvider는 인증·라우팅·페이지 이탈과 공통 피드백을 연결합니다.':
    'OwpCoreProvider configures the app environment, settings, state and QueryClient. OwpStyleProvider applies the theme, while OwpUiProvider connects authentication, routing, page leave guards and shared feedback.',
  'API 요청은 createOwpApiHooks로 한 번 설정하고 useApiQuery·useApiMutation으로 사용합니다. 페이지·검색·다이얼로그는 같은 앱 설정과 상태를 공유합니다.':
    'Configure API requests once with createOwpApiHooks, then call useApiQuery and useApiMutation. Pages, search filters and dialogs share the same app settings and state.',

  '레지스트리 설정': 'Registry setup',
  '프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.':
    'Set the internal OWP registry URL in the project root’s .npmrc file.',
  '패키지 설치': 'Install packages',
  'Dependencies: React 19 · Material UI 9 · Emotion 11 · i18next':
    'Dependencies: React 19 · Material UI 9 · Emotion 11 · i18next',
  터미널: 'Terminal',
  'react-router-dom, react-hook-form, notistack 등 peer dependency는 설치한 패키지의 package.json을 확인하세요.':
    'See the installed package’s package.json for peer dependencies, including react-router-dom, react-hook-form and notistack.',
  '앱 초기화': 'Initialize the app',
  '참조 프로젝트의 AppProviders 구성을 줄인 예제입니다. 앱의 i18next를 먼저 초기화하고 routes·navigation·settings를 전달합니다.':
    'This simplified example follows the reference project’s AppProviders. Initialize i18next first, then provide routes, navigation and settings.',

  '스타일과 정적 리소스': 'Styles & static assets',
  'Core CSS는 html 10px을 기준으로 합니다. MUI theme의 typography.htmlFontSize도 10으로 맞춥니다.':
    'Core CSS uses a 10px HTML baseline. Set typography.htmlFontSize to 10 in the MUI theme as well.',
  'Vite의 plugins에 owpCoreAssetsPlugin()을 추가하면 아이콘·폰트를 복사할 수 있습니다.':
    'Add owpCoreAssetsPlugin() to Vite plugins to copy the icons and fonts.',
  '요청 방식': 'Request mode',
  '응답 모드': 'Response mode',
  'JSON 객체': 'JSON object',
  'JSON 배열': 'JSON array',
  '빈 객체 {}': 'Empty object {}',
  '빈 문자열 ""': 'Empty string ""',
  '응답 판정': 'Response checks',
  '오류 알림 표시': 'Show error notifications',
  'resultCode 없음': 'Missing resultCode',
  'resultCode가 null': 'Null resultCode',
  '배열 응답': 'Array response',
  '인증 오류 응답': 'Authentication error',
  '기본 검사': 'Default checks',
  'resultCode 누락 허용': 'Allow missing resultCode',
  '호출부 직접 판정': 'Caller-owned checks',
  'Query와 GET mutation으로 같은 응답을 요청하고 성공 판정과 오류 안내를 비교합니다.':
    'Request the same response with Query and GET mutation to compare success checks and error messages.',
  'Query와 GET mutation으로 OWP 응답과 raw JSON 응답을 요청하고 반환값을 비교합니다.':
    'Request OWP responses and raw JSON with Query and GET mutation to compare the returned values.',
  'raw는 HTTP 성공 시 JSON body 전체를 반환합니다. 업무 코드·인증 응답 판정과 성공 알림은 생략하고 HTTP·네트워크 오류와 오류 알림 설정은 유지합니다.':
    'For HTTP success, raw returns the entire JSON body. It skips business-code and authentication-response checks and success notifications, while preserving HTTP and network errors and the error notification setting.',
  '요청이 완료되었습니다. 데이터 탭에서 원본 응답을 확인하세요.':
    'Request completed. Inspect the original response in Data.',
  'Query는 successResultCode를 검사합니다. 오류 알림을 꺼도 실패와 인증 오류 처리는 유지합니다.':
    'Query checks successResultCode. Turning off error notifications preserves rejection and authentication handling.',
  '수동 모드의 요청 완료는 업무 성공을 뜻하지 않습니다. resultCode와 인증 오류를 호출부에서 확인해야 합니다.':
    'A completed manual request does not prove business success. The caller must check resultCode and authentication errors.',
  'HTTP 성공 객체에 resultCode 필드가 없을 때만 허용합니다. null과 실패 코드, 배열은 허용하지 않습니다.':
    'Only HTTP success objects without a resultCode field are allowed. Null or failure codes and arrays remain rejected.',
  '기본 모드는 HTTP 성공과 STATUS_1을 함께 확인합니다.':
    'Default checks require HTTP success and STATUS_1.',
  'Query·mutation의 성공 코드 검사와 코드 누락 허용·수동 오류 처리를 비교합니다.':
    'Compare success-code checks, missing-code allowance, and manual error handling in queries and mutations.',
  'Query·mutation의 OWP 응답 판정과 raw JSON 반환을 비교합니다.':
    'Compare OWP response checks and raw JSON return values in queries and mutations.',
};
