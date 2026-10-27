import { useEffect, useEffectEvent, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { OwpLanguageSwitcherSelect } from '@owp/core';
import { useGetCurrentLanguage } from '@owp/core/hooks';
import { getApiLanguageCode, getI18nextLanguageCode } from '@owp/core/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const currentLanguage = useGetCurrentLanguage();
  const [codes, setCodes] = useState<{ api: string; i18next: string } | null>(null);

  const onLanguageChanged = useEffectEvent((language: string) => {
    onRecord(
      'language.change',
      JSON.stringify({ requested: language, app: language === 'en' ? 'en' : 'ko' }),
    );
    if (language === 'kr' || language === 'lc') void i18n.changeLanguage('ko');
  });

  useEffect(() => {
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n]);

  useEffect(() => {
    onData({
      coreLanguage: currentLanguage,
      appLanguage: i18n.language,
      reloadOnChange: false,
      appLocales: ['ko', 'en'],
      coreLocales: ['kr', 'en', 'lc'],
      codes,
    });
  }, [currentLanguage, i18n.language, onData, codes]);

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
        <Button
          variant="outlined"
          onClick={() => setCodes({ api: getApiLanguageCode(), i18next: getI18nextLanguageCode() })}
        >
          {t('언어 코드 확인')}
        </Button>
        {codes && (
          <Typography role="status">
            {t('API 언어 코드')}: {codes.api} · {t('i18next 언어 코드')}: {codes.i18next}
          </Typography>
        )}
      </DemoSection>
    </CoreDemo>
  );
}
