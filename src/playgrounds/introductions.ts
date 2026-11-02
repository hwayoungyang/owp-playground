/** 설치된 패키지 README의 소개를 Playground 문체에 맞춰 정리합니다. */
export const packageIntroductions = {
  core: '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 React UI 컴포넌트, 스타일과 실행 리소스를 제공하는 패키지입니다.',
  components:
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 재사용하는 MUI 컴포넌트와 공통 UI 기능을 제공하는 패키지입니다.',
  charts:
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 차트 구현에 사용하는 React 컴포넌트를 제공하는 패키지입니다.',
  datagrid:
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 대용량 데이터 처리와 계층형 데이터 조회·편집을 지원하는 React DataGrid 패키지입니다.',
  'date-picker':
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 날짜·시간 입력 컴포넌트와 Dayjs 설정을 제공하는 패키지입니다.',
  excel:
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 ExcelJS loader, OWP workbook 계약, 셀 서식과 Excel 유틸을 제공하는 패키지입니다.',
  pdf: '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 PDF 컴포넌트, 타입, 폰트 등록과 렌더링 유틸을 제공하는 패키지입니다.',
  theme:
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 테마 계약과 기본값을 제공하는 패키지입니다.',
  utils:
    '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 공통 유틸리티 패키지입니다. 숫자 변환과 포맷팅, 문자열 처리, 브라우저 제어, 바코드·QR 코드 생성, ZIP 파일 읽기 기능을 제공합니다.',
} as const;

export const standaloneGuidePackageIds = ['date-picker', 'excel', 'pdf', 'theme', 'utils'] as const;
export type StandaloneGuidePackageId = (typeof standaloneGuidePackageIds)[number];

export function hasStandaloneGuide(id: string): id is StandaloneGuidePackageId {
  return standaloneGuidePackageIds.some((candidate) => candidate === id);
}

export function packageGuideEntry(playground: { readonly id: string; readonly name: string }) {
  return {
    id: 'getting-started',
    title: '시작하기',
    kind: 'guide',
    category: 'docs',
    package: playground.name,
    description: '패키지를 설치하고 MCP 연결과 공개 API 사용 방법을 확인합니다.',
    api: [],
    source: '',
  } as const;
}
