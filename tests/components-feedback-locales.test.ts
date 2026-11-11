import '../src/app/i18n';
import { i18next } from '@owp/core/i18n';
import { describe, expect, it } from 'vitest';
import { componentsOwpEnglish } from '../src/playgrounds/components/locales/owp.en';
import { focusedDateEnglish } from '../src/playgrounds/date-picker/focused.en';
import { focusedUtilsEnglish } from '../src/playgrounds/utils/focused.en';

describe('Components package messages', () => {
  it.each(Object.entries({ ...focusedDateEnglish, ...focusedUtilsEnglish }))(
    'loads the focused example translation for %s in both namespaces',
    (key, english) => {
      for (const ns of ['app', 'owp']) {
        expect(i18next.t(key, { ns, lng: 'en' })).toBe(english);
        expect(i18next.exists(key, { ns, lng: 'ko' })).toBe(true);
      }
    },
  );
  it.each(Object.entries(componentsOwpEnglish))(
    'translates %s in the actual owp namespace',
    (key) => {
      const english = i18next.t(key, { ns: 'owp', lng: 'en' });
      expect(english).not.toMatch(/[가-힣]|^(?:Label|Message)\./u);
      const korean = i18next.t(key, { ns: 'owp', lng: 'ko' });
      expect(korean).not.toMatch(/^(?:Label|Message)\./u);
      expect(korean).toMatch(/[가-힣]/u);
    },
  );

  it('preserves existing Grid and Charts translations when adding Components defaults', () => {
    expect(i18next.t('Label.변경', { ns: 'owp', lng: 'en' })).toBe('Changed');
    expect(i18next.t('Label.건', { ns: 'owp', lng: 'en' })).toBe('rows');
    expect(i18next.t('Message.조회 결과가 없습니다.', { ns: 'owp', lng: 'en' })).toBe(
      'No data found.',
    );
    expect(i18next.t('Message.저장하시겠습니까?', { ns: 'owp', lng: 'en' })).toBe(
      'Save these changes?',
    );
    expect(i18next.t('Label.저장', { ns: 'owp', lng: 'en' })).toBe('Save');
  });
});
