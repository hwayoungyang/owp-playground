import { coreFoundations } from '../src/playgrounds/core/guides/foundation-content.ts';

const titles = {
  ...Object.fromEntries(
    coreFoundations.map((guide) => [
      guide.knowledgeId,
      ['역할과 적용 범위', ...guide.sections.map((section) => section.title)],
    ]),
  ),
  '@owp/core:guide.setup': [
    '패키지 역할과 설치본',
    '앱 초기화와 provider',
    'API·인증·페이지 권한',
    '라우팅과 앱 정책',
    '테마 선택·설정·영속 저장',
    'CSS와 정적 리소스',
    '언어와 앱 bridge',
    '역할별 예제와 import 기준',
    'MCP 연결과 버전 고정',
  ],
  '@owp/core:guide.selection': [
    'API selector 계약',
    '예제 요청과 응답',
    '공통코드 cache',
    '선택 라벨과 outline',
  ],
  '@owp/core:guide.composition': [
    '패키지별 역할과 연결',
    'Dialog 상태와 닫기 확인',
    '검색 진행과 페이지 이탈',
    '테마와 앱 UI 상태',
    'Render·route·chunk 오류 복구',
    'Excel·ZIP·요청 데이터 변환',
  ],
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
