import { useEffect, useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { ExampleResult } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { CodeSnippet } from '../../../features/code/CodeSnippet';

const setup = `import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

await i18next.use(initReactI18next).init({
  lng: 'ko',
  fallbackLng: 'ko',
  keySeparator: false,
  resources: {
    ko: { owp: { '안녕하세요, {{name}}님.': '안녕하세요, {{name}}님.' } },
    en: { owp: { '안녕하세요, {{name}}님.': 'Hello, {{name}}.' } },
  },
});`;

export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const { t, i18n, ready } = useOwpTranslation();
  const [name, setName] = useState('OWP');
  const [count, setCount] = useState(2);
  const greeting = t('안녕하세요, {{name}}님.', { name });
  const quantity = t('선택한 항목 {{count}}개', { count });
  const fallbackKey = 'Message.PlaygroundTranslationFallback';
  const fallback = t(fallbackKey, { defaultValue: t('번역이 없을 때 표시할 문장') });
  useEffect(() => {
    onData({ language: i18n.language, ready, greeting, quantity, fallback });
  }, [onData, i18n.language, ready, greeting, quantity, fallback]);
  return (
    <>
      <ExampleSection
        title="먼저 i18next 설정하기"
        description="앱에서 i18next를 초기화하고 initReactI18next로 연결합니다. 번역 문구는 owp namespace에 등록합니다."
      >
        <Typography variant="body2">
          {t(
            '이미 번역을 설정한 앱에서는 기존 i18next를 사용합니다. 이 Hook이 번역 설정을 초기화하지는 않습니다.',
          )}
        </Typography>
        <CodeSnippet label="i18n.ts" code={setup} language="typescript" />
      </ExampleSection>
      <ExampleSection
        title="문장에 이름 넣기"
        description="이름을 입력하면 인사말에 바로 반영됩니다."
      >
        <Stack spacing={2}>
          <TextField
            size="small"
            label={t('인사할 이름')}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Typography>{greeting}</Typography>
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="수량과 언어 바꾸기"
        description="수량을 입력하고 화면 상단의 언어를 바꿔 번역 결과를 비교하세요."
      >
        <Stack spacing={2}>
          <TextField
            size="small"
            type="number"
            label={t('선택 수량')}
            value={count}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value)) setCount(Math.max(0, Math.floor(value)));
            }}
          />
          <Typography>{quantity}</Typography>
          <Typography variant="body2">
            {t('language는 현재 언어, ready는 번역 리소스의 준비 상태입니다.')}
          </Typography>
          <ExampleResult value={{ language: i18n.language, ready }} />
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="번역이 없을 때 표시할 문구"
        description="등록된 번역이 없으면 defaultValue로 지정한 문구를 표시합니다."
      >
        <Typography>{fallback}</Typography>
      </ExampleSection>
    </>
  );
}
