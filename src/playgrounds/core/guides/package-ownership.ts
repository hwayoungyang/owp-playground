export const coreOwnershipIntroduction =
  'Core는 앱 설정·인증·라우팅·API 요청을 담당합니다. 입력·표·다이얼로그 같은 공통 UI는 Components에서 가져옵니다. 테마·Excel·유틸은 각각 Theme·Excel·Utils의 공개 API를 사용합니다.';

export const coreOwnershipNotes = {
  'search-filter': {
    name: 'OwpSearchFilter · useSearchAction',
    body: '검색 폼은 Components, 조회 실행과 취소는 Core의 useSearchAction을 사용합니다. run·cancel·isRunning·isCanceling을 화면에 연결하고, progressFilter로 진행 상태를 추적할 query를 지정합니다.',
  },
  'page-carded': {
    name: 'OwpPageCarded · usePageLeaveGuard',
    body: '페이지의 header·content·sidebar 배치는 Components가 처리합니다. 저장하지 않은 내용이 있을 때 페이지 이동을 확인하려면 Core의 usePageLeaveGuard에 dirty 상태를 전달합니다.',
  },
  dialog: {
    name: 'OwpDialog · useOwpDialogs',
    body: '다이얼로그 표시·중첩·닫기와 포커스 복원은 Components가 처리합니다. 저장하지 않은 내용 확인도 같은 패키지를 사용합니다. DialogProps는 @owp/components/types, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.',
  },
  'page-content': {
    name: 'OwpPageContent',
    body: '페이지 제목·보조 영역·본문과 반응형 배치는 Components가 처리합니다. Core의 별도 연결 설정은 필요하지 않습니다.',
  },
  'app-settings': {
    name: 'OwpTable · OwpFieldTable',
    body: 'Table과 FieldTable은 @owp/components에서 가져옵니다. Core OwpStyleProvider가 Theme provider에 앱 테마를 전달하며, FieldTable 날짜 표시는 호출부가 dateFormatter로 지정합니다.',
  },
  'error-boundary': {
    name: 'OwpErrorBoundary · OwpRouteErrorElement',
    body: '일반 오류 UI는 @owp/components의 OwpErrorBoundary를 사용합니다. chunk 복구가 필요하면 @owp/utils/browser의 recoverFromDynamicImportChunkLoadError를 직접 전달하고 오류 보고 callback은 앱에서 정합니다. Data Router 오류 해석은 Core OwpRouteErrorElement가 담당합니다.',
  },
} as const;

export const coreOwnershipUsageNote =
  '검색·페이지 UI는 Components에서 가져옵니다. 페이지 이동 확인과 조회 진행 상태는 Core에서 가져와 필요한 화면에 직접 연결합니다.';
