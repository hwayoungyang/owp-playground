import { useEffect, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useDiscardGuard, useOwpTranslation } from '@owp/components/hooks';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function GuardSample({
  id,
  initialDraft,
  getter,
  report,
  onRecord,
}: SectionObserver & { readonly initialDraft: string; readonly getter: boolean }) {
  const { t } = useOwpTranslation();
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState('');
  const [runs, setRuns] = useState(0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const dirty = draft !== saved;
  const guard = useDiscardGuard(getter ? () => draft !== saved : dirty);
  useEffect(() => {
    report(id, { draft, saved, dirty, runs, pending, result });
  }, [report, id, draft, saved, dirty, runs, pending, result]);
  async function request() {
    setPending(true);
    onRecord(`${id}.request`, getter ? 'getter' : 'boolean');
    try {
      setResult(
        await guard.requestDiscard(() => setRuns((value) => value + 1), { intent: 'discard' }),
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label={t('샘플 메모')}
        value={draft}
        disabled={pending}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Stack direction="row" useFlexGap sx={{ gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" disabled={pending} onClick={() => void request()}>
          {t('확인 후 횟수 늘리기')}
        </Button>
        <Button
          variant="outlined"
          disabled={pending}
          onClick={() => {
            setSaved(draft);
            onRecord(`${id}.baseline`, draft);
          }}
        >
          {t('저장 기준 갱신')}
        </Button>
      </Stack>
      <Typography>
        {t(dirty ? '저장하지 않은 변경 사항이 있습니다.' : '변경 사항이 없습니다.')}
      </Typography>
      <ExampleResult value={{ result, runs, dirty }} />
      {guard.confirmation}
    </Stack>
  );
}
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <>
      <ExampleSection
        title="변경이 없는 영역"
        description="변경 내용이 없으면 확인창 없이 작업을 실행합니다."
      >
        <GuardSample
          id="clean"
          initialDraft=""
          getter={false}
          report={report}
          onRecord={onRecord}
        />
      </ExampleSection>
      <ExampleSection
        title="변경이 있는 영역"
        description="진행을 승인하면 실행 횟수가 늘어납니다. 메모와 저장한 내용은 그대로 유지됩니다."
      >
        <GuardSample
          id="dirty"
          initialDraft="OWP"
          getter={false}
          report={report}
          onRecord={onRecord}
        />
      </ExampleSection>
      <ExampleSection
        title="작업 요청 시 변경 여부 확인"
        description="작업을 요청하면 현재 메모와 저장한 내용을 비교합니다. 취소하면 작업을 실행하지 않습니다."
      >
        <GuardSample id="getter" initialDraft="OWP" getter report={report} onRecord={onRecord} />
      </ExampleSection>
    </>
  );
}
