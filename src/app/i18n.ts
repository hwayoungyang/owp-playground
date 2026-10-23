import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { chartEnglish } from '../playgrounds/charts/locales/en';
import { coreEnglish } from '../playgrounds/core/locales/en';
import { chartOwpEnglish } from '../playgrounds/charts/locales/owp.en';
import { catalogEnglish } from '../playgrounds/datagrid/locales/catalog.en';
import { owpEnglish } from '../playgrounds/datagrid/locales/owp.en';
import { appEnglish } from '../shared/i18n/app.en';

const english = { ...appEnglish, ...catalogEnglish, ...chartEnglish, ...coreEnglish };
const korean = Object.fromEntries(
  Object.keys(english).map((key) => [
    key,
    key.replace(/_(?:zero|one|two|few|many|other|theme)$/, ''),
  ]),
);
const coreKorean = {
  'Label.검색': '검색',
  'Label.한국어': '한국어',
  'Label.English': 'English',
  'Label.Etc': '기타',
  'Label.확인': '확인',
  'Label.취소': '취소',
  'Label.홈으로': '홈으로',
  'Message.문제가 발생했습니다.': '문제가 발생했습니다.',
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
    ko: { app: korean, owp: { ...korean, ...coreKorean } },
    kr: { app: korean, owp: { ...korean, ...coreKorean } },
    en: { app: english, owp: { ...english, ...owpEnglish, ...chartOwpEnglish } },
  },
  interpolation: { escapeValue: false },
  initAsync: false,
});
