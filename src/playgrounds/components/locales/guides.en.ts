export const guidesEnglish = {
  'Components 설치부터 첫 숫자 입력과 공개 API 사용까지 안내합니다.':
    'Install Components, create your first number field, and use its public APIs.',
  'Components의 역할': 'What Components provides',
  '@owp/components는 Material UI 기반의 입력·선택·표·레이아웃·피드백 컴포넌트와 관련 Hooks·Utils를 제공합니다. 필요한 공개 API를 가져와 React 화면에 조합합니다.':
    '@owp/components provides Material UI-based inputs, selectors, tables, layouts, feedback components, and related hooks and utilities. Import the public APIs you need and compose them in a React screen.',
  '필수 peer dependency는 React·React DOM 19, Material UI·MUI System 9, Emotion React·Styled 11입니다. 아래 명령은 Components {{version}}의 지원 범위를 사용합니다.':
    'Required peer dependencies are React and React DOM 19, Material UI and MUI System 9, and Emotion React and Styled 11. The command below uses the supported ranges for Components {{version}}.',
  '기본 사용법': 'Basic usage',
  'MUI ThemeProvider에 테마를 연결하고 OwpNumberField의 값을 문자열 state로 관리합니다. onValueChange에서 info.source가 event일 때 next.value를 저장하며, helperText로 입력 형식을 안내합니다.':
    'Connect a theme through MUI ThemeProvider and manage the OwpNumberField value as string state. In onValueChange, save next.value when info.source is event, and use helperText to explain the input format.',
  '예제에는 MUI ThemeProvider와 CssBaseline이 포함되어 있습니다. 프로젝트에 같은 설정이 있다면 기존 Provider 아래에 OwpNumberField를 배치합니다.':
    'The example includes MUI ThemeProvider and CssBaseline. If your project already has this setup, place OwpNumberField under the existing provider.',
  '컴포넌트·Hooks·Utils 사용법': 'Public import paths and examples',
  '컴포넌트는 @owp/components, hook은 @owp/components/hooks, 유틸은 @owp/components/utils에서 가져옵니다. 각 예제에서 실제 옵션과 연결 방법을 확인할 수 있습니다.':
    'Import components from @owp/components, hooks from @owp/components/hooks, and utilities from @owp/components/utils. Open the examples to see their options and integration.',
} as const;
