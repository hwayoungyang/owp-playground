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
  컴포넌트: 'Components',
  'Components 실행 영역': 'Components workspace',
} as const;
