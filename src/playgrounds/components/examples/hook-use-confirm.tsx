import { useEffect, useState } from 'react';
import { Button, Stack } from '@mui/material';
import { OwpDialogsProvider } from '@owp/components/feedback';
import { useConfirm, useOwpTranslation, type UseConfirmOptions } from '@owp/components/hooks';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function ConfirmSample({
  id,
  methods,
  report,
  onRecord,
}: SectionObserver & {
  readonly methods: readonly (
    | 'confirm'
    | 'confirmInfo'
    | 'confirmSave'
    | 'confirmUpdate'
    | 'confirmDelete'
  )[];
}) {
  const { t } = useOwpTranslation();
  const confirms = useConfirm();
  const [result, setResult] = useState<boolean | null | undefined>(null);
  const [callbackCount, setCallbackCount] = useState(0);
  const [callbackResult, setCallbackResult] = useState<boolean | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    report(id, {
      result: result === undefined ? 'undefined' : result,
      method,
      pending,
      callbackCount,
      callbackResult,
    });
  }, [report, id, result, method, pending, callbackCount, callbackResult]);
  async function request(kind: (typeof methods)[number]) {
    setPending(true);
    setCallbackCount(0);
    setCallbackResult(null);
    setMethod(kind);
    onRecord(`${id}.open`, kind);
    try {
      const options: UseConfirmOptions = {
        onClose: async (accepted) => {
          setCallbackCount((count) => count + 1);
          setCallbackResult(accepted);
          await Promise.resolve();
          onRecord(`${id}.onClose`, String(accepted));
        },
      };
      setResult(
        await (kind === 'confirm'
          ? confirms.confirm({
              ...options,
              title: t('계속 진행하시겠습니까?'),
              description: t('확인하거나 취소할 수 있습니다.'),
              okText: t('확인'),
              cancelText: t('취소'),
            })
          : confirms[kind](options)),
      );
      onRecord(`${id}.resolved`, kind);
    } finally {
      setPending(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 2 }}>
        {methods.map((kind) => (
          <Button
            variant="outlined"
            key={kind}
            disabled={pending}
            onClick={() => void request(kind)}
          >
            {kind}
          </Button>
        ))}
      </Stack>
      <ExampleResult
        value={{
          method,
          result: result === undefined ? 'undefined' : result,
          pending,
          callbackCount,
          callbackResult,
        }}
      />
    </Stack>
  );
}
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <OwpDialogsProvider>
      <>
        <ExampleSection
          title="문구를 직접 지정한 확인창"
          description="onClose callback은 한 번 실행되고 완료 후 결과 Promise가 끝납니다. closeAll에서는 callback이 false를 받고 Promise 결과는 undefined입니다."
        >
          <ConfirmSample id="custom" methods={['confirm']} report={report} onRecord={onRecord} />
        </ExampleSection>
        <ExampleSection
          title="확인 버튼만 있는 안내"
          description="confirmInfo는 기본 안내 문구와 확인 버튼을 사용합니다."
        >
          <ConfirmSample id="info" methods={['confirmInfo']} report={report} onRecord={onRecord} />
        </ExampleSection>
        <ExampleSection
          title="저장·수정·삭제 기본값"
          description="각 확인창의 기본 문구와 버튼 색상을 비교합니다."
        >
          <ConfirmSample
            id="presets"
            methods={['confirmSave', 'confirmUpdate', 'confirmDelete']}
            report={report}
            onRecord={onRecord}
          />
        </ExampleSection>
      </>
    </OwpDialogsProvider>
  );
}
