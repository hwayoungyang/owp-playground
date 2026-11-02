import { publicDescriptionEnglish } from './descriptions';
import { apiRoleEnglish } from './roles';
import { apiKindDescriptionEnglish } from './description-kind';

export const publicApiEnglish = {
  ...publicDescriptionEnglish,
  ...apiRoleEnglish,
  ...apiKindDescriptionEnglish,
  '공개 타입': 'Public type',
  'SVG 아이콘': 'SVG icon',
  '{{name}} Props': '{{name}} props',
  '패키지 스타일': 'Package styles',
  '패키지 정보': 'Package metadata',
  'Grid 스크롤바 기본 스타일': 'Default grid scrollbar styles',
  'Grid 드래그 기본 스타일': 'Default grid drag styles',
  '공개 설정값': 'Public configuration value',
  '호출 형식 {{number}}의 반환값': 'Returns for signature {{number}}',
  '{{name}} 항목': '{{name}} fields',
  '반환 객체': 'Returned object',
  '{{name}} SVG 아이콘을 표시합니다. 크기·색상 등은 Props에서 설정합니다.':
    'Renders the {{name}} SVG icon. Configure its size, color, and other options in Props.',
  '{{name}}은 Grid 스크롤바의 기본 스타일 값입니다. 값과 타입은 Type 탭에서 확인할 수 있습니다.':
    '{{name}} defines a default grid scrollbar style value. See Type for its value and type.',
  '{{name}}은 Grid 드래그 상태의 기본 스타일 값입니다. 값과 타입은 Type 탭에서 확인할 수 있습니다.':
    '{{name}} defines a default grid drag style value. See Type for its value and type.',
  '공개 API': 'Public API',
  '다른 import 경로': 'Other import paths',
  '다른 공개 진입점': 'Other import paths',
  '공개 API {{count}}개': '{{count}} public APIs',
  '공개 API 검색': 'Search public APIs',
  'API 상세 보기': 'API detail views',
  '공개 API를 불러오는 중…': 'Loading public APIs…',
  '공개 API 항목을 찾을 수 없습니다.': 'The public API entry could not be found.',
  '{{module}}에서 공개하는 API입니다.': 'An API exported from {{module}}.',
  '선언 출처: {{name}}': 'Declared by {{name}}',
  '{{name}}의 API를 re-export합니다.': 'Re-exports an API from {{name}}.',
  Styles: 'Styles',
  CSS: 'CSS',
  '스타일·설정 파일': 'Styles',
  '{{name}} 객체의 속성': 'Properties of {{name}}',
  '반환 객체의 속성·메서드': 'Properties and methods of the returned object',
  '반환값 표': 'Return value table',
  '사용 예제': 'Usage example',
  '이 JavaScript 진입점은 TypeScript 선언을 제공하지 않습니다. unknown은 타입 정보가 없음을 뜻합니다.':
    'This JavaScript entry point does not provide TypeScript declarations. unknown indicates that type information is unavailable.',
  Params: 'Params',
  Returns: 'Returns',
  Context: 'Context',
  Types: 'Types',
  Values: 'Values',
} as const;

export const publicApiKorean = {
  '선언 출처: {{name}}': '타입 정의 출처: {{name}}',
  '다른 공개 진입점': '다른 import 경로',
  '공개 설정값': '패키지에서 export한 값',
  '공개 타입': '패키지에서 export한 타입',
  '호출 형식': 'Signature',
  '호출 형식 {{number}}': 'Signature {{number}}',
  '함수 시그니처': 'Signature',
  '함수 시그니처 {{number}}': 'Signature {{number}}',
  '호출 형식 {{number}}의 반환값': 'Signature {{number}}의 반환값',
  '{{module}}에서 공개하는 API입니다.': '{{module}}에서 import할 수 있습니다.',
  '각 Prop에 원본 패키지 출처를 표시합니다.': '각 Prop이 정의된 패키지를 표시합니다.',
  '이 항목의 import 예제가 없습니다.': '이 API의 import 경로를 확인할 수 없습니다.',
  '이 선언에는 Props가 없습니다.': '이 타입 선언에는 Props가 없습니다.',
  '이 JavaScript 진입점은 TypeScript 선언을 제공하지 않습니다. unknown은 타입 정보가 없음을 뜻합니다.':
    '이 JavaScript 모듈에는 TypeScript 타입 선언이 없습니다. unknown은 타입 정보를 확인할 수 없다는 뜻입니다.',
} as const;
