import { useEffect, useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { evaluateDirty } from '@owp/components/utils';
import { ExampleResult } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [draft, setDraft] = useState('OWP');
  const [result, setResult] = useState<boolean | null>(null);
  useEffect(() => {
    onData({
      boolean: { clean: evaluateDirty(false), dirty: evaluateDirty(true) },
      getters: { clean: evaluateDirty(() => false), dirty: evaluateDirty(() => true) },
      currentDraft: draft,
      lastEvaluation: result,
    });
  }, [onData, draft, result]);
  return (
    <>
      <ExampleSection
        title="boolean을 그대로 평가"
        description="false와 true를 그대로 반환합니다. 평가 때문에 입력값이나 저장 기준을 바꾸지 않습니다."
      >
        <ExampleResult value={{ false: evaluateDirty(false), true: evaluateDirty(true) }} />
      </ExampleSection>
      <ExampleSection
        title="함수로 변경 여부 확인"
        description="함수를 전달하면 그 함수의 반환값을 사용합니다. 두 결과를 비교하세요."
      >
        <ExampleResult
          value={{ clean: evaluateDirty(() => false), dirty: evaluateDirty(() => true) }}
        />
      </ExampleSection>
      <ExampleSection
        title="버튼을 누른 시점의 메모"
        description="버튼을 누를 때 현재 메모가 비어 있는지 확인합니다. 결과는 다음 클릭까지 유지됩니다."
      >
        <Stack spacing={2}>
          <TextField
            label={t('샘플 메모')}
            size="small"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            variant="outlined"
            onClick={() => {
              const next = evaluateDirty(() => draft.length > 0);
              setResult(next);
              onRecord('current.evaluate', String(next));
            }}
          >
            {t('현재 dirty 평가')}
          </Button>
          <ExampleResult value={{ draft, lastEvaluation: result }} />
        </Stack>
      </ExampleSection>
    </>
  );
}
