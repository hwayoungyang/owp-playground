import { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { createDiscardGuard } from '@owp/components/utils';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function ControllerSample({
  id,
  initialDraft,
  report,
  onRecord,
}: SectionObserver & { readonly initialDraft: string }) {
  const { t } = useOwpTranslation();
  const [controller] = useState(createDiscardGuard);
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [draft, setDraft] = useState(initialDraft);
  const [runs, setRuns] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    controller.setActive(true);
    return () => controller.setActive(false);
  }, [controller]);
  useEffect(() => {
    report(id, {
      draft,
      dirty: draft.length > 0,
      pendingIntent: snapshot?.intent ?? null,
      runs,
      result,
      pending,
    });
  }, [report, id, draft, snapshot, runs, result, pending]);
  async function request() {
    setPending(true);
    onRecord(`${id}.request`, 'discard');
    try {
      setResult(
        await controller.request(
          () => draft.length > 0,
          () => setRuns((value) => value + 1),
        ),
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Stack spacing={2}>
      <TextField
        label={t('샘플 메모')}
        value={draft}
        size="small"
        disabled={pending}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Button variant="outlined" disabled={pending} onClick={() => void request()}>
        {t('확인 후 횟수 늘리기')}
      </Button>
      {snapshot && (
        <Alert severity="warning">
          <Stack spacing={2}>
            <span>{t('저장하지 않고 계속 진행하시겠습니까?')}</span>
            <Stack direction="row" useFlexGap sx={{ gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  controller.cancel();
                  onRecord(`${id}.cancel`, 'false');
                }}
              >
                {t('계속 편집')}
              </Button>
              <Button variant="outlined" onClick={() => void controller.resolve(true)}>
                {t('진행 승인')}
              </Button>
            </Stack>
          </Stack>
        </Alert>
      )}
      <ExampleResult value={{ result, runs, dirty: draft.length > 0, pending }} />
    </Stack>
  );
}
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <>
      <ExampleSection
        title="변경 내용이 없는 경우"
        description="메모가 비어 있으면 확인창 없이 작업을 실행합니다."
      >
        <ControllerSample id="clean" initialDraft="" report={report} onRecord={onRecord} />
      </ExampleSection>
      <ExampleSection
        title="승인·취소를 직접 연결"
        description="변경 확인 요청이 오면 확인창을 표시합니다. 취소하면 작업을 실행하지 않고 false를 반환합니다."
      >
        <ControllerSample id="dirty" initialDraft="OWP" report={report} onRecord={onRecord} />
      </ExampleSection>
      <ExampleSection
        title="서로 다른 영역의 변경 확인"
        description="이 영역의 확인 요청은 다른 영역과 독립적입니다. 승인해도 메모와 dirty는 유지됩니다."
      >
        <ControllerSample
          id="independent"
          initialDraft="Alpha"
          report={report}
          onRecord={onRecord}
        />
      </ExampleSection>
    </>
  );
}
