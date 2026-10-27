export const extensionsEnglish: Readonly<Record<string, string>> = {
  '앱 초기화와 실행 범위': 'App initialization and scope',
  'Core·Style·UI 프로바이더와 useInitApp을 앱 진입점에 연결합니다. 페이지들이 같은 환경·테마·공통 UI를 사용합니다.':
    'Connect the Core, Style and UI providers and useInitApp at the app entry point to share the environment, theme and common UI.',
  'API 요청과 캐시': 'API requests and cache',
  'createOwpApiHooks에 API 주소와 응답 코드를 지정합니다. 조회·변경 hook과 QueryClient가 요청 상태와 캐시를 관리합니다.':
    'Set the API URL and response code in createOwpApiHooks. Query and mutation hooks and QueryClient manage request state and cache.',
  '인증과 페이지 권한': 'Authentication and page permissions',
  '인증 결과를 useApplyAuthenticatedUser로 적용하고 사용자·메뉴·페이지 권한 hook으로 읽습니다. getStartPagePath는 메뉴에서 시작 경로를 정합니다.':
    'Apply authentication with useApplyAuthenticatedUser and read user, menu and page permissions through hooks. getStartPagePath selects the start route from the menu.',
  '공통코드 상태와 선택': 'Common-code state and selectors',
  '공통코드 hook으로 그룹 목록을 읽고 설정하며 필터링합니다. selector는 이 상태와 조회를 연결합니다.':
    'Read, update and filter grouped common codes with hooks. Selectors connect this state to queries.',
  '앱 설정과 테마 상태': 'App settings and theme state',
  '현재·기본 설정, 레이아웃, 영역별 테마와 스크롤 설정을 구독합니다. 설정 hook으로 변경·초기화하면 관련 화면이 함께 갱신됩니다.':
    'Subscribe to current/default settings, layout, area themes and scrollbar settings. Updating or resetting settings refreshes the affected screens.',
  '확인 창과 다이얼로그 상태': 'Confirmation and dialog state',
  'useOwpDialogs로 다이얼로그를 열고 Promise 결과를 받습니다. useConfirm의 저장·수정·삭제 helper는 동작에 맞는 확인 문구를 제공합니다.':
    'Open dialogs with useOwpDialogs and await their results. useConfirm helpers provide messages for saving, updating and deleting.',
  '미저장 변경과 화면 정책': 'Unsaved changes and page policies',
  'useDiscardGuard는 영역별 변경을, usePageLeaveGuard는 페이지 이동을 보호합니다. Dialog·PageCarded policy는 공통 UI에 Core 정책을 연결합니다.':
    'useDiscardGuard protects a local region and usePageLeaveGuard protects navigation. Dialog and PageCarded policies connect Core behavior to common UI.',
  '요청 진행과 화면 잠금': 'Request progress and page locking',
  'useSearchAction으로 검색 진행·취소를 추적하고 usePageLockLoading으로 공통 화면 잠금을 제어합니다. UI 프로바이더에서 요청 취소와 잠금 표시를 연결합니다.':
    'Track search progress and cancellation with useSearchAction and control the shared page lock with usePageLockLoading. The UI provider connects cancellation and lock rendering.',
  '오류 처리와 복구': 'Error handling and recovery',
  'errorBoundaryPolicy와 OwpRouteErrorElement를 각각 render 오류와 Data Router 오류에 연결합니다. 복구 정책과 화면 오류 표시를 함께 확인합니다.':
    'Connect errorBoundaryPolicy to render errors and OwpRouteErrorElement to Data Router errors to verify recovery and error presentation.',
  'API Inspector': 'API Inspector',
  'diagnostics.apiInspector.enabled를 설정하고 useOwpApiInspectorDialog로 기록 창을 엽니다. 요청·응답·소요 시간을 같은 화면에서 확인합니다.':
    'Enable diagnostics.apiInspector.enabled and open the inspector with useOwpApiInspectorDialog to inspect requests, responses and timings.',
  '검색 조건과 JSON 변환': 'Search parameters and JSON conversion',
  '날짜 범위를 검색 키로 옮기고 값을 JSON body·문자열로 변환합니다. query·form 모드와 빈 값 처리 결과를 비교합니다.':
    'Map date ranges to search keys and convert values into JSON bodies or strings. Compare query/form modes and empty-value handling.',
  '파일 데이터와 ZIP 저장': 'File data and ZIP downloads',
  '파일·추가 필드를 FormData 업로드 변수로 구성하고 Blob을 ZIP으로 저장합니다. fetchFile·openFileBySeq는 프로젝트의 파일 API·인증 설정이 필요합니다.':
    'Prepare files and additional fields for FormData upload and save Blobs as ZIP. fetchFile and openFileBySeq require your project’s file API and authentication configuration.',
  '로그인 입력값 정리': 'Login input cleanup',
  '아이디·비밀번호 입력에서 제거되는 문자를 비교합니다. 입력값 정리 결과와 인증·비밀번호 정책 검증을 구분합니다.':
    'Compare which characters are removed from user ID and password inputs. Input cleanup is separate from authentication and password-policy validation.',
  '언어 초기화와 코드 변환': 'Language initialization and codes',
  'initOwpI18n과 언어 상태를 연결하고 API용 대문자 코드와 i18next용 소문자 코드를 확인합니다. useStorage의 환경 설정은 사용자 설정 저장과 별도로 관리합니다.':
    'Connect initOwpI18n to language state and inspect uppercase API and lowercase i18next codes. Manage environment storage separately from user settings.',
  'Core UI 정책 연결': 'Core UI policy adapters',

  'Store와 기본 구성': 'Store and default configuration',
  '독립 실행 범위가 필요할 때 공개 store·atom을 사용합니다. 테마 기본값과 상수는 설정 구성에 사용하며 페이지마다 store를 새로 만들 필요는 없습니다.':
    'Use public stores and atoms for an isolated scope. Theme defaults and constants support configuration; pages normally share their existing store.',
  '기능별 API 안내': 'Feature API guide',
  'Core가 직접 구현한 hooks·utils·진단 기능과 문서·실행 예제를 역할별로 찾습니다.':
    'Find Core-owned hooks, utilities and diagnostics with related guides and runnable examples.',
  'Core가 직접 구현한 기능을 역할별로 정리했습니다. 각 기능의 설정 방법과 기대효과를 확인하고 문서·실행 예제·공개 API로 이동할 수 있습니다.':
    'Explore Core-owned features by responsibility, their setup and benefits, and links to guides, runnable examples and public APIs.',
  '메모를 수정한 뒤 닫기를 누르면 저장하지 않은 변경을 확인합니다. 계속 편집을 선택하면 입력이 유지되고, 닫기를 승인하면 예제에서 메모를 비우고 편집 영역을 닫습니다.':
    'Edit the note and select Close to confirm unsaved changes. Keep editing preserves the input; confirming Close clears the sample note and closes the editor.',
  '저장하지 않은 변경 사항이 있습니다.': 'There are unsaved changes.',
  '변경 사항이 없습니다.': 'No changes.',
  '메모 편집을 닫았습니다.': 'The note editor is closed.',
  '다시 열기': 'Reopen',
  '공개 API 목록': 'Public API list',
  '미저장 변경 확인': 'Unsaved changes confirmation',
  '메모를 저장하지 않고 닫을 때 변경 확인 창을 표시합니다.':
    'Confirm unsaved changes before closing the note editor.',
  '샘플 메모': 'Sample note',
  '변경 있음': 'Yes',
  '변경 없음': 'No',
  '아이디·비밀번호 문자열의 정리 규칙과 변환 결과를 비교합니다.':
    'Compare cleanup rules and outputs for user ID and password strings.',
  '아이디는 공백과 한글을 제거하고, 비밀번호는 영문·숫자·허용된 특수문자를 남깁니다. 입력값 정리와 인증·비밀번호 정책 검증은 별개입니다.':
    'User IDs remove whitespace and Korean characters; passwords retain English letters, digits and allowed punctuation. Cleanup is separate from authentication and password-policy validation.',
  '비교할 샘플 문자열': 'Sample input to compare',
  '변환 결과': 'Output',
  '확인 동작': 'Confirmation action',
  '언어 코드 확인': 'Read language codes',
  'API 언어 코드': 'API language code',
  'i18next 언어 코드': 'i18next language code',
};
