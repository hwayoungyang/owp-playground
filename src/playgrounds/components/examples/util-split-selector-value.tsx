import { useEffect, useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { splitSelectorValue } from '@owp/components/utils';
import { ExampleResult } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [value, setValue] = useState('alpha, beta, alpha');
  useEffect(() => {
    onData({
      empty: {
        omitted: splitSelectorValue(),
        empty: splitSelectorValue(''),
        whitespace: splitSelectorValue(' , '),
      },
      trimmed: splitSelectorValue(' alpha, beta, , gamma '),
      custom: { input: value, result: splitSelectorValue(value) },
    });
  }, [onData, value]);
  return (
    <>
      <ExampleSection
        title="값 없음·빈 문자열·공백"
        description="인수를 생략하거나 빈 항목만 전달하면 빈 배열을 반환합니다."
      >
        <ExampleResult
          value={{
            undefined: splitSelectorValue(),
            '': splitSelectorValue(''),
            ' , ': splitSelectorValue(' , '),
          }}
        />
      </ExampleSection>
      <ExampleSection
        title="앞뒤 공백과 빈 항목"
        description="각 항목의 앞뒤 공백을 제거하고 빈 문자열이 된 항목은 제외합니다."
      >
        <ExampleResult
          value={{
            input: ' alpha, beta, , gamma ',
            result: splitSelectorValue(' alpha, beta, , gamma '),
          }}
        />
      </ExampleSection>
      <ExampleSection
        title="직접 입력과 중복 값"
        description="입력값을 바꿔 결과를 확인하세요. 같은 값이 여러 번 나와도 유지합니다."
      >
        <Stack spacing={2}>
          <TextField
            size="small"
            label={t('쉼표로 구분한 선택 값')}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <ExampleResult value={splitSelectorValue(value)} />
        </Stack>
      </ExampleSection>
    </>
  );
}
