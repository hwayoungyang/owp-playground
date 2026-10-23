import { basicEnglish } from './basic.en';
import { advancedEnglish } from './advanced.en';
import { sessionEnglish } from './session.en';

export const coreEnglish: Readonly<Record<string, string>> = {
  ...basicEnglish,
  ...advancedEnglish,
  ...sessionEnglish,
  'Label.검색': 'Search',
  시작하기: 'Getting started',
  문서: 'Documentation',
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
  'API hook을 설정하고 조회·빈 결과·오류를 처리합니다.':
    'Configure API hooks and handle successful, empty and failed responses.',
  '검색 조건과 결과를 페이지의 header와 content로 구성합니다.':
    'Arrange search filters and results in the page header and content.',
  '제목·보조 영역·액션을 조합하고 로딩 상태와 반응형 배치를 확인합니다.':
    'Compose titles, slots and actions, then compare loading and responsive layouts.',
  '검색 조건을 입력해 조회하고 조건 초기화와 비동기 진행 상태를 확인합니다.':
    'Submit search criteria and try reset and asynchronous progress.',
  '로컬 응답 데이터를 실제 API selector로 조회하고 선택 값을 확인합니다.':
    'Load a local response with the API selector and inspect the selected value.',
  '같은 공통코드 데이터를 Select와 Radio group으로 선택합니다.':
    'Select from the same common code data with Select and Radio group.',
  '다이얼로그를 열고 결과를 받아 저장하며 미저장 변경을 보호합니다.':
    'Open a dialog, save its returned value and protect unsaved changes.',
  '공통 dialog hook으로 확인·취소에 따른 상태 변화를 확인합니다.':
    'Use the shared dialog hook to compare confirm and cancel outcomes.',
  '로딩 indicator의 종류와 크기를 비교합니다.': 'Compare loading indicator styles and sizes.',
  '오류 경계에서 렌더 오류를 처리하고 복구합니다.':
    'Catch a render error with an error boundary and restore the content.',
  'Core 언어 선택으로 한국어·영어 표시를 전환합니다.':
    'Switch between Korean and English with the Core language selector.',
  '화면 데이터를 공통 Excel 버튼으로 파일에 저장합니다.':
    'Download the displayed data with the shared Excel export button.',
  '글자 크기 (px)': 'Font size (px)',
  'Core 설정을 변경하면 같은 store를 사용하는 테이블에 바로 반영됩니다.':
    'Changes to Core settings immediately update tables that share the same store.',
  '설정 미리보기': 'Settings preview',
  개수: 'Count',
  조회: 'Search',
  '조회 버튼으로 mock 응답을 요청합니다.': 'Use the search button to request a mock response.',
  '조회에 실패했습니다. 다시 시도해 주세요.': 'The request failed. Please try again.',
  '조회 버튼을 눌러 주세요.': 'Choose Search to load the data.',
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
  '한금 소비앱의 AppProviders 구성을 줄인 예제입니다. 앱의 i18next를 먼저 초기화하고 routes·navigation·settings를 전달합니다.':
    'This simplified AppProviders example follows the Hankum app. Initialize i18next first, then provide routes, navigation and settings.',
  'OwpUiProvider는 React Router Data Router 안에 배치합니다. Playground의 독립 예제는 서버 인증 없이 실행합니다.':
    'Place OwpUiProvider inside a React Router Data Router. The standalone Playground examples run without server authentication.',
  '스타일과 정적 리소스': 'Styles & static assets',
  'Core CSS는 html 10px을 기준으로 합니다. MUI theme의 typography.htmlFontSize도 10으로 맞춥니다.':
    'Core CSS uses a 10px HTML baseline. Set typography.htmlFontSize to 10 in the MUI theme as well.',
  'Vite의 plugins에 owpCoreAssetsPlugin()을 추가하면 아이콘·폰트를 복사할 수 있습니다.':
    'Add owpCoreAssetsPlugin() to Vite plugins to copy the icons and fonts.',
};
