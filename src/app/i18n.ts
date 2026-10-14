import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { catalogEnglish } from '../playgrounds/datagrid/locales/catalog.en';
import { owpEnglish } from '../playgrounds/datagrid/locales/owp.en';
import { appEnglish } from '../shared/i18n/app.en';

const english = { ...appEnglish, ...catalogEnglish };
const korean = Object.fromEntries(
  Object.keys(english).map((key) => [
    key,
    key.replace(/_(?:zero|one|two|few|many|other|theme)$/, ''),
  ]),
);

await i18next.use(initReactI18next).init({
  lng: 'ko',
  fallbackLng: 'ko',
  defaultNS: 'app',
  ns: ['app', 'owp'],
  keySeparator: false,
  nsSeparator: false,
  resources: {
    ko: { app: korean, owp: {} },
    en: { app: english, owp: owpEnglish },
  },
  interpolation: { escapeValue: false },
  initAsync: false,
});
