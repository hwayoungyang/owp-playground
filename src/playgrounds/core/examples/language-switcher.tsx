import { useEffect } from 'react';
import { Typography } from '@mui/material';
import { OwpLanguageSwitcherSelect } from '@owp/core';
import { useGetCurrentLanguage } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const currentLanguage = useGetCurrentLanguage();

  useEffect(() => {
    const handleChange = (language: string) => {
      onRecord(
        'language.change',
        JSON.stringify({ requested: language, app: language === 'en' ? 'en' : 'ko' }),
      );
      if (language === 'kr' || language === 'lc') void i18n.changeLanguage('ko');
    };
    i18n.on('languageChanged', handleChange);
    return () => {
      i18n.off('languageChanged', handleChange);
    };
  }, [i18n, onRecord]);

  useEffect(() => {
    onData({
      coreLanguage: currentLanguage,
      appLanguage: i18n.language,
      reloadOnChange: false,
      appLocales: ['ko', 'en'],
      coreLocales: ['kr', 'en', 'lc'],
    });
  }, [currentLanguage, i18n.language, onData]);

  return (
    <CoreDemo>
      <DemoSection>
        <div className="core-field">
          <OwpLanguageSwitcherSelect
            label={t('표시 언어')}
            reloadOnChange={false}
            fullWidth
            variant="outlined"
            size="small"
          />
        </div>
        <Typography component="p">{t('선택한 언어로 표시됩니다.')}</Typography>
      </DemoSection>
    </CoreDemo>
  );
}
