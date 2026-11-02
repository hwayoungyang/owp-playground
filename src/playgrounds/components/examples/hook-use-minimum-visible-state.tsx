import { useEffect, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { useMinimumVisibleState, useOwpTranslation } from '@owp/components/hooks';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function LoadingSample({
  id,
  duration,
  taskDuration,
  report,
  onRecord,
}: SectionObserver & { readonly duration?: number; readonly taskDuration: number }) {
  const { t } = useOwpTranslation();
  const [working, setWorking] = useState(false);
  const visible = useMinimumVisibleState(working, duration);
  useEffect(() => {
    if (!working) return;
    const timer = window.setTimeout(() => setWorking(false), taskDuration);
    return () => window.clearTimeout(timer);
  }, [working, taskDuration]);
  useEffect(() => {
    report(id, { working, visible, minDuration: duration ?? 400, taskDuration });
  }, [report, id, working, visible, duration, taskDuration]);
  return (
    <Stack spacing={2}>
      <Button
        variant="outlined"
        disabled={visible}
        onClick={() => {
          setWorking(true);
          onRecord(`${id}.start`, String(taskDuration));
        }}
      >
        {t('샘플 작업 시작')}
      </Button>
      <Alert severity={visible ? 'info' : 'success'}>
        {t(visible ? '처리 중 안내가 보입니다.' : '처리 중 안내가 닫혔습니다.')}
      </Alert>
      <ExampleResult value={{ working, visible }} />
    </Stack>
  );
}
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <>
      <ExampleSection
        title="기본 최소 시간"
        description="100ms 작업이 끝나도 기본 최소 시간인 400ms 동안 안내를 유지합니다."
      >
        <LoadingSample id="default" taskDuration={100} report={report} onRecord={onRecord} />
      </ExampleSection>
      <ExampleSection
        title="최소 시간을 1초로 지정"
        description="같은 100ms 작업에 1초의 최소 표시 시간을 지정합니다."
      >
        <LoadingSample
          id="one-second"
          duration={1000}
          taskDuration={100}
          report={report}
          onRecord={onRecord}
        />
      </ExampleSection>
      <ExampleSection
        title="작업이 최소 시간보다 긴 경우"
        description="작업이 1.2초 동안 이어지면 400ms가 지나도 안내를 닫지 않습니다."
      >
        <LoadingSample
          id="long-task"
          duration={400}
          taskDuration={1200}
          report={report}
          onRecord={onRecord}
        />
      </ExampleSection>
    </>
  );
}
