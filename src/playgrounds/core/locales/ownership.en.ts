export const ownershipEnglish: Readonly<Record<string, string>> = {
  '패키지별 역할과 연결 방법 보기': 'View package responsibilities and integration',
  '패키지별 역할과 연결': 'Package responsibilities and integration',
  'Core는 앱 설정·인증·라우팅·OWP API를, Components는 공통 UI와 Dialog 상태를 소유합니다. 공통 UI는 Components에서 직접 가져오며 Theme·Excel·Utils도 해당 패키지의 공개 API를 사용합니다.':
    'Core owns app settings, authentication, routing and OWP APIs. Components owns shared UI and dialog state. Import shared UI directly from Components, and use the public APIs of Theme, Excel and Utils for their respective responsibilities.',
  '검색·페이지 UI는 Components에서, 페이지 이탈과 OWP query 진행은 Core에서 가져와 필요한 위치에 직접 연결합니다. wrapper나 policy re-export를 거치지 않습니다.':
    'Import search and page UI from Components, and page leave protection and OWP query progress from Core. Connect them directly where needed without wrapper or policy re-exports.',
  'OwpUiProvider는 React Router Data Router 안에 배치하고, 페이지 이동 보호가 필요한 화면에서 usePageLeaveGuard를 호출합니다. Playground의 독립 예제는 서버 인증 없이 실행합니다.':
    'Place OwpUiProvider inside a React Router Data Router and call usePageLeaveGuard in pages requiring navigation protection. Standalone Playground examples run without server authentication.',
  'Core 설정·테마를 읽고 변경하며 Components Table·FieldTable에 반영되는 값을 확인합니다.':
    'Read and update Core settings and themes, and inspect the values applied to Components Table and FieldTable.',
  'Excel 패키지로 파일을 생성하고 MUI 버튼에서 다운로드합니다.':
    'Create a file with the Excel package and download it from an MUI button.',
  'Components useDiscardGuard는 영역별 변경을, Core usePageLeaveGuard는 페이지 이동을 보호합니다. 공통 UI와 페이지 이동의 역할을 직접 연결합니다.':
    'Components useDiscardGuard protects local changes, while Core usePageLeaveGuard protects page navigation. Connect shared UI and navigation responsibilities directly.',
  '일반 오류 UI는 Components OwpErrorBoundary를, chunk 복구는 Utils를 사용합니다. Core OwpRouteErrorElement는 Data Router 오류를 해석합니다.':
    'Use Components OwpErrorBoundary for general error UI and Utils for chunk recovery. Core OwpRouteErrorElement interprets Data Router errors.',
  '패키지별 기능 연결': 'Package integration',
  'Core의 앱 기능과 Components·Theme·Excel·Utils의 공개 API를 필요한 위치에 직접 연결합니다. 공통 UI의 동작과 타입은 소유 패키지에서 확인합니다.':
    'Connect Core app features and the public APIs of Components, Theme, Excel and Utils directly where needed. Consult the owning package for shared UI behavior and types.',
  'Package Integration': 'Package integration',
  '검색 폼은 @owp/components에서 가져옵니다. Core useSearchAction의 run·cancel·isRunning·isCanceling을 페이지에서 직접 연결하고 progressFilter로 추적할 query를 지정합니다.':
    'Import the search form from @owp/components. Connect run, cancel, isRunning and isCanceling from Core useSearchAction directly in the page, and use progressFilter to select the tracked queries.',
  'header·content·sidebar·스크롤·반응형 배치는 @owp/components가 처리합니다. 페이지 이동의 미저장 변경 확인은 Core usePageLeaveGuard에 dirty 상태를 전달합니다.':
    '@owp/components handles the header, content, sidebar, scrolling and responsive layout. Pass the dirty state to Core usePageLeaveGuard to protect page navigation.',
  'Dialog UI·미저장 변경 확인·stack·lifecycle·포커스 복원은 @owp/components가 처리합니다. DialogProps는 @owp/components/types, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.':
    '@owp/components handles dialog UI, unsaved-change confirmation, stack, lifecycle and focus restoration. Import DialogProps from @owp/components/types and useOwpDialogs, useConfirm and useDiscardGuard from @owp/components/hooks.',
  '제목·보조 영역·본문·반응형 스타일은 @owp/components가 처리합니다. Core 스타일 slot이나 별도 policy를 연결하지 않습니다.':
    '@owp/components handles the title, auxiliary areas, body and responsive styles. No Core style slot or separate policy is required.',
  'Table과 FieldTable은 @owp/components에서 가져옵니다. Core OwpStyleProvider가 Theme provider에 앱 테마를 전달하며, FieldTable 날짜 표시는 호출부가 dateFormatter로 지정합니다.':
    'Import Table and FieldTable from @owp/components. Core OwpStyleProvider passes the app theme to the Theme provider. The caller supplies dateFormatter for FieldTable dates.',
  '일반 오류 UI는 @owp/components의 OwpErrorBoundary를 사용합니다. chunk 복구가 필요하면 @owp/utils/browser의 recoverFromDynamicImportChunkLoadError를 직접 전달하고 오류 보고 callback은 앱에서 정합니다. Data Router 오류 해석은 Core OwpRouteErrorElement가 담당합니다.':
    'Use OwpErrorBoundary from @owp/components for general error UI. When chunk recovery is needed, pass recoverFromDynamicImportChunkLoadError from @owp/utils/browser directly and define error reporting in the app. Core OwpRouteErrorElement interprets Data Router errors.',
};
