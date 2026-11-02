import { clarityEnglish } from './clarity.en';
import { componentEnglish } from './components.en';
import { hooksUtilsEnglish } from './hooks-utils.en';
import { scenarioEnglish } from './scenarios.en';
import { guidesEnglish } from './guides.en';
import { componentsApiEnglish } from './api.en';

export const componentsEnglish = {
  ...componentEnglish,
  ...hooksUtilsEnglish,
  ...scenarioEnglish,
  ...guidesEnglish,
  ...componentsApiEnglish,
  ...clarityEnglish,
  입력·선택: 'Inputs & selectors',
  버튼·작업: 'Buttons & actions',
  Section·페이지: 'Sections & pages',
  Dialog·피드백: 'Dialogs & feedback',
  반응형·스크롤: 'Responsive layout & scrolling',
  '기타 컴포넌트': 'Other components',
  컴포넌트: 'Components',
  'Components 실행 영역': 'Components workspace',
  '아이콘 미리보기': 'Icon preview',
  '아이콘 목록': 'Icon gallery',
  '기본 아이콘은 Heroicons Outline·Solid를 사용하며, OWP에 추가된 아이콘도 함께 제공합니다.':
    'Default icons use Heroicons Outline and Solid, alongside icons added to OWP.',
  'Heroicons에서 아이콘 찾기': 'Find icons on Heroicons',
  '아래 목록에는 OWP에서 제공하는 아이콘 컴포넌트만 표시합니다.':
    'The list below shows only icon components provided by OWP.',
  '아이콘 버전과 패키지 역할': 'Icon version and package roles',
  '아이콘 컴포넌트': 'Icon components',
  '추가 SVG sprite': 'Additional SVG sprites',
  '기본 아이콘은 Components 번들에 포함되므로 Core 없이 사용할 수 있습니다. 내장 목록 밖의 SVG sprite를 사용할 때는 Core의 assets/icons를 배포하거나 앱에서 직접 제공해야 합니다.':
    'Default icons are bundled with Components and work without Core. For SVG sprites outside the built-in set, deploy Core’s assets/icons or provide the files from your app.',
  '아이콘 이름 검색': 'Search icon names',
  '아이콘 {{count}}개': '{{count}} icons',
  '아이콘 {{count}}개_one': '{{count}} icon',
  '아이콘 {{count}}개_other': '{{count}} icons',
  '아이콘을 확인하고 선택하면 API 상세로 이동합니다.':
    'View icons and select one to open its API details.',
  'SVG sprite 예시: 다운로드 아이콘': 'SVG sprite example: download icon',
} as const;
