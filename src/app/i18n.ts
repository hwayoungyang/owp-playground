import { i18next, initReactI18next } from '@owp/core/i18n';
import { chartEnglish } from '../playgrounds/charts/locales/en';
import { coreEnglish } from '../playgrounds/core/locales/en';
import { componentsEnglish } from '../playgrounds/components/locales/en';
import { integrationsEnglish } from '../playgrounds/integrations/locales.en';
import { tailwindEnglish } from '../playgrounds/tailwind-config/locales.en';
import { barcodeEnglish } from '../playgrounds/utils/barcode.en';
import { focusedDateEnglish } from '../playgrounds/date-picker/focused.en';
import { focusedUtilsEnglish } from '../playgrounds/utils/focused.en';
import {
  componentsOwpEnglish,
  componentsOwpKorean,
} from '../playgrounds/components/locales/owp.en';
import { apiInspectorKorean } from '../playgrounds/core/locales/api-inspector.en';
import { chartOwpEnglish } from '../playgrounds/charts/locales/owp.en';
import { catalogEnglish } from '../playgrounds/datagrid/locales/catalog.en';
import { owpEnglish } from '../playgrounds/datagrid/locales/owp.en';
import { appEnglish } from '../shared/i18n/app.en';
import { koreanOverrides } from './korean-overrides';
import { normalizeAppTerminology } from '../shared/i18n/reference-copy';
import { formatKoreanGuidance } from '../shared/i18n/guidance-copy';
import { publicApiEnglish, publicApiKorean } from '../features/public-api/locales';

const english = {
  ...publicApiEnglish,
  ...appEnglish,
  ...catalogEnglish,
  ...chartEnglish,
  ...coreEnglish,
  ...componentsEnglish,
  ...integrationsEnglish,
  ...tailwindEnglish,
  ...barcodeEnglish,
  ...focusedDateEnglish,
  ...focusedUtilsEnglish,
};
const korean = Object.fromEntries(
  Object.entries({
    ...Object.fromEntries(
      Object.keys(english).map((key) => [
        key,
        key.replace(/_(?:zero|one|two|few|many|other|theme)$/, ''),
      ]),
    ),
    ...koreanOverrides,
    ...publicApiKorean,
  }).map(([key, value]) => [key, formatKoreanGuidance(normalizeAppTerminology(value))]),
);
const coreKorean = {
  ...apiInspectorKorean,
  'Label.검색': '검색',
  'Label.한국어': '한국어',
  'Label.English': 'English',
  'Label.Etc': '기타',
  'Label.확인': '확인',
  'Label.취소': '취소',
  'Label.홈으로': '홈으로',
  'Label.닫기': '닫기',
  'Label.로딩 중...': '로딩 중...',
  'Label.계속 편집': '계속 편집',
  'Label.이동': '이동',
  'Label.진행': '진행',
  'Label.변경': '변경',
  'Label.조회': '조회',
  'Label.초기화': '초기화',
  'Label.덮어쓰기': '덮어쓰기',
  'Message.문제가 발생했습니다.': '문제가 발생했습니다.',
  'Message.저장하지 않은 변경 내용이 있습니다.': '저장하지 않은 변경 내용이 있습니다.',
  'Message.저장하지 않고 이동하면 변경 내용이 사라집니다.':
    '저장하지 않고 이동하면 변경 내용이 사라집니다.',
  'Message.저장하지 않고 진행하면 변경 내용이 사라집니다. 진행하시겠습니까?':
    '저장하지 않고 진행하면 변경 내용이 사라집니다. 진행하시겠습니까?',
  'Message.저장하지 않고 닫으면 변경 내용이 사라집니다.':
    '저장하지 않고 닫으면 변경 내용이 사라집니다.',
};
const requestedLanguage =
  typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('lang');

await i18next.use(initReactI18next).init({
  lng: requestedLanguage === 'en' ? 'en' : 'ko',
  fallbackLng: 'ko',
  defaultNS: 'app',
  ns: ['app', 'owp'],
  keySeparator: false,
  nsSeparator: false,
  resources: {
    ko: { app: korean, owp: { ...componentsOwpKorean, ...korean, ...coreKorean } },
    kr: { app: korean, owp: { ...componentsOwpKorean, ...korean, ...coreKorean } },
    en: {
      app: english,
      owp: { ...componentsOwpEnglish, ...english, ...owpEnglish, ...chartOwpEnglish },
    },
  },
  interpolation: { escapeValue: false },
  initAsync: false,
});
