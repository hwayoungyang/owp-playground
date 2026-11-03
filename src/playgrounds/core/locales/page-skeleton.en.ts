export const pageSkeletonEnglish = {
  '페이지 로딩 Skeleton': 'Page loading skeleton',
  '목록·요약 화면의 Skeleton과 로딩 완료 후 모습을 비교하고, 재방문 시 동작을 확인합니다.':
    'Compare the list and summary skeletons with their loaded screens, then try returning to a screen.',
  '목록 화면': 'List screen',
  '요약 화면': 'Summary screen',
  '로딩 완료하기': 'Finish loading',
  '미리 볼 화면': 'Screen to preview',
  '{{page}} · {{state}}': '{{page}} · {{state}}',
  '준비 완료': 'Ready',
  '로딩 중': 'Loading',
  '화면별 로딩 미리보기': 'Preview loading by screen',
  '목록·요약 화면을 선택하고, 로딩 전후의 모습을 비교해 보세요.':
    'Choose a list or summary screen to compare its loading and loaded states.',
  '미리 볼 화면을 선택해 주세요.': 'Choose a screen to preview.',
  '위에서 목록 화면이나 요약 화면을 선택해 주세요.': 'Choose the list or summary screen above.',
  '{{page}}을 모두 불러왔습니다.': '{{page}} has finished loading.',
  '목록 화면은 검색·표 형태, 요약 화면은 숫자·차트 형태의 Skeleton을 사용합니다.':
    'The list skeleton has a search area and table. The summary skeleton has metrics and a chart.',
  '한 번 불러온 화면은 다시 선택할 때 로딩 없이 바로 표시됩니다. 상단의 초기화를 누르면 첫 로딩부터 다시 확인할 수 있습니다.':
    'Once loaded, a screen appears immediately when selected again. Use Reset above to try the first load again.',
  'Skeleton을 살펴본 뒤 로딩 완료하기를 눌러 주세요.':
    'Inspect the skeleton, then choose Finish loading.',
  '페이지별 로딩 Skeleton': 'Page loading skeleton configuration',
  'OwpCoreProvider의 slotProps.routeLoading.getSkeletonSpec에 경로별 OwpPageSkeletonSpec을 반환하는 함수를 전달합니다. OwpLayout은 첫 방문의 Suspense 대기 중 내부 PageSkeleton을 표시합니다. 앱에서 내부 컴포넌트를 직접 import하지 않습니다. 페이지 로딩 Skeleton 예제에서 Provider 등록·로딩 완료·재방문을 비교할 수 있습니다.':
    'Pass a function returning an OwpPageSkeletonSpec for each path to OwpCoreProvider through slotProps.routeLoading.getSkeletonSpec. OwpLayout displays its internal PageSkeleton while Suspense is pending on the first visit. Apps do not import the internal component. The Page loading skeleton example demonstrates provider registration, loading completion, and return visits.',
} as const;
