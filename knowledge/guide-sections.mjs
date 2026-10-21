const titles = {
  '@owp/charts:guide.composition': [
    '차트 구성',
    '옵션 우선순위',
    '공통 preset과 확장',
    '시간 axis와 date adapter',
    '시간 데이터와 초기화',
    '로그 axis',
    'Subtitle',
    '앱과 패키지의 역할',
  ],
  '@owp/datagrid:guide.connection': [
    'Import 경로',
    'Hook 연결',
    'Hook과 Ref 비교',
    '연결 수명과 호출 시점',
    '다이얼로그에서 조회',
    '행 ID',
    '조회 데이터의 ID 생성',
    '설정과 참조 유지',
    '값 조회와 변경',
  ],
};

/** 기존 가이드의 문단과 순서를 보존하며 탐색용 제목을 연결합니다. */
export function guideSections(guide) {
  const headings = titles[guide.id];
  if (!headings) return undefined;
  const paragraphs = guide.body.split('\n\n');
  if (paragraphs.length !== headings.length)
    throw new RangeError(`가이드 문단 구성을 다시 검토하세요: ${guide.id}`);
  return headings.map((title, index) => ({ title, body: paragraphs[index] }));
}
