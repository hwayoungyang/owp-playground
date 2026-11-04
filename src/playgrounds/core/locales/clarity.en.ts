export const coreClarityEnglish = {
  'Core는 앱 설정·인증·라우팅·API 요청을 담당합니다. 입력·표·다이얼로그 같은 공통 UI는 Components에서 가져옵니다. 테마·Excel·유틸은 각각 Theme·Excel·Utils의 공개 API를 사용합니다.':
    'Core handles app settings, authentication, routing, and API requests. Import shared inputs, tables, and dialogs from Components. Use Theme, Excel, and Utils for their respective public APIs.',
  '검색 폼은 Components, 조회 실행과 취소는 Core의 useSearchAction을 사용합니다. run·cancel·isRunning·isCanceling을 화면에 연결하고, progressFilter로 진행 상태를 추적할 query를 지정합니다.':
    'Use OwpSearchFilter from Components for the search form and useSearchAction from Core to control searches. Call run to start a search or cancel to cancel tracked queries. Use isRunning and isCanceling to display search and cancellation status. Set progressFilter to select which queries to track.',
  '페이지의 header·content·sidebar 배치는 Components가 처리합니다. 저장하지 않은 내용이 있을 때 페이지 이동을 확인하려면 Core의 usePageLeaveGuard에 dirty 상태를 전달합니다.':
    'Components lays out the page header, content, and sidebar. Pass dirty to Core usePageLeaveGuard to confirm navigation when changes are unsaved.',
  '다이얼로그 표시·중첩·닫기와 포커스 복원은 Components가 처리합니다. 저장하지 않은 내용 확인도 같은 패키지를 사용합니다. DialogProps는 @owp/components/types, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.':
    'Components manages dialog display, stacking, closing, focus restoration, and unsaved-change confirmation. Import DialogProps from @owp/components/types and useOwpDialogs, useConfirm, and useDiscardGuard from @owp/components/hooks.',
  '페이지 제목·보조 영역·본문과 반응형 배치는 Components가 처리합니다. Core의 별도 연결 설정은 필요하지 않습니다.':
    'Components handles the page title, extra areas, content, and responsive layout. No additional Core integration is needed.',
  '검색·페이지 UI는 Components에서 가져옵니다. 페이지 이동 확인과 조회 진행 상태는 Core에서 가져와 필요한 화면에 직접 연결합니다.':
    'Import search and page UI from Components. Connect Core navigation protection and query progress directly to the screens that need them.',
  '업무 오류 (STATUS_0)': 'Business error (STATUS_0)',
  '요청 중입니다.': 'Request in progress.',
  'HTTP 요청 실패': 'HTTP request failed',
  '업무 처리 실패': 'Operation failed',
  '응답 판정 실패': 'Response check failed',
  '요청 실패': 'Request failed',
  '업무 오류 응답': 'Business error response',
  '요청 완료': 'Request completed',
  '요청은 완료되었지만 resultCode가 STATUS_0입니다. 응답 내용을 확인해 주세요.':
    'The request completed with resultCode STATUS_0. Review the response.',
  '아래에서 응답 JSON을 확인할 수 있습니다.': 'The response JSON is shown below.',
  'HTTP 상태: {{status}}': 'HTTP status: {{status}}',
} as const;
