export const coreOwnershipIntroduction =
  'Core는 앱 설정·인증·라우팅·OWP API를, Components는 공통 UI와 Dialog 상태를 소유합니다. 공통 UI는 Components에서 직접 가져오며 Theme·Excel·Utils도 해당 패키지의 공개 API를 사용합니다.';

export const coreOwnershipNotes = {
  'search-filter': {
    name: 'OwpSearchFilter · useSearchAction',
    body: '검색 폼은 @owp/components에서 가져옵니다. Core useSearchAction의 run·cancel·isRunning·isCanceling을 페이지에서 직접 연결하고 progressFilter로 추적할 query를 지정합니다.',
  },
  'page-carded': {
    name: 'OwpPageCarded · usePageLeaveGuard',
    body: 'header·content·sidebar·스크롤·반응형 배치는 @owp/components가 처리합니다. 페이지 이동의 미저장 변경 확인은 Core usePageLeaveGuard에 dirty 상태를 전달합니다.',
  },
  dialog: {
    name: 'OwpDialog · useOwpDialogs',
    body: 'Dialog UI·미저장 변경 확인·stack·lifecycle·포커스 복원은 @owp/components가 처리합니다. DialogProps는 @owp/components/types, useOwpDialogs·useConfirm·useDiscardGuard는 @owp/components/hooks에서 가져옵니다.',
  },
  'page-content': {
    name: 'OwpPageContent',
    body: '제목·보조 영역·본문·반응형 스타일은 @owp/components가 처리합니다. Core 스타일 slot이나 별도 policy를 연결하지 않습니다.',
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
  '검색·페이지 UI는 Components에서, 페이지 이탈과 OWP query 진행은 Core에서 가져와 필요한 위치에 직접 연결합니다. 래퍼나 policy 재노출을 거치지 않습니다.';
