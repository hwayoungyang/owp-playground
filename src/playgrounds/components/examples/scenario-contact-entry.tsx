import { useEffect, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { OwpTextMaskField, OwpRequiredHelperText, OwpFieldHelperText } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { ExampleSection } from '../runtime/ExampleSection';
import type { ComponentsExampleProps } from '../model/types';

export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState({ formatted: '', digits: '' });
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const nameMissing = submitted && name.trim().length === 0;
  const phoneInvalid = submitted && phone.digits.length !== 11;
  useEffect(() => {
    onData({ name, phone, submitted, saved });
  }, [name, phone, submitted, saved, onData]);
  return (
    <>
      <ExampleSection
        title="필수 항목과 입력 형식"
        description="이름과 11자리 연락처를 입력한 뒤 입력 확인 버튼을 누르세요."
      >
        <Stack
          spacing={2}
          component="form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            const valid = name.trim().length > 0 && phone.digits.length === 11;
            setSaved(valid);
            onRecord('contact.validate', String(valid));
          }}
        >
          <OwpFieldHelperText>
            <OwpRequiredHelperText required>{t('필수 입력 항목입니다.')}</OwpRequiredHelperText>
          </OwpFieldHelperText>
          <div className="components-example-grid">
            <TextField
              label={t('이름')}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
              required
              error={nameMissing}
              helperText={nameMissing ? t('이름을 입력해 주세요.') : undefined}
              size="small"
            />
            <OwpTextMaskField
              label={t('연락처')}
              mask="000-0000-0000"
              value={phone.formatted}
              placeholder="010-1234-5678"
              required
              error={phoneInvalid}
              size="small"
              helperText={
                phoneInvalid
                  ? t('연락처 11자리를 입력해 주세요.')
                  : t('숫자만 입력하면 하이픈을 붙여 표시합니다.')
              }
              onChange={(event) => {
                setPhone({ formatted: event.target.value, digits: event.unmaskedValue });
                setSaved(false);
              }}
            />
          </div>
          <Button type="submit" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {t('입력 확인')}
          </Button>
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="입력 확인 결과"
        description="입력한 값만 검사합니다. 실제 연락처 인증이나 서버 전송은 수행하지 않습니다."
      >
        <Typography role="status">
          {t(saved ? '입력한 이름과 연락처 형식을 확인했습니다.' : '입력 확인 버튼을 눌러 주세요.')}
        </Typography>
      </ExampleSection>
    </>
  );
}
