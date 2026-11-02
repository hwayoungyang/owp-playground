import { useEffect, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { OwpDialog } from '@owp/components';
import { OwpDialogsProvider } from '@owp/components/feedback';
import { useOwpDialogs, useOwpTranslation } from '@owp/components/hooks';
import type { DialogProps } from '@owp/components/types';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

type InputPayload = { readonly initialValue: string };
function InputDialog({ payload, open, onClose }: DialogProps<InputPayload, string | null>) {
  const { t } = useOwpTranslation();
  const [draft, setDraft] = useState(payload.initialValue);
  return (
    <OwpDialog
      open={open}
      title={t('메모 입력')}
      confirmText={t('확인')}
      cancelText={t('취소')}
      fullWidth
      maxWidth="xs"
      onClose={() => void onClose(null)}
      onCancel={() => void onClose(null)}
      onConfirm={() => void onClose(draft)}
    >
      <TextField
        autoFocus
        fullWidth
        size="small"
        label={t('샘플 메모')}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </OwpDialog>
  );
}

const buttonLabels = {
  alert: '알림 창 열기',
  confirm: '확인 창 열기',
  input: '입력창 열기',
} as const;
function DialogSample({
  id,
  kind,
  report,
  onRecord,
}: SectionObserver & { readonly kind: keyof typeof buttonLabels }) {
  const { t } = useOwpTranslation();
  const dialogs = useOwpDialogs();
  const [result, setResult] = useState<string | boolean | null>(null);
  const [settled, setSettled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    report(id, { result, settled, pending, error });
  }, [report, id, result, settled, pending, error]);
  async function open() {
    setPending(true);
    setSettled(false);
    setError(null);
    onRecord(`${id}.open`, kind === 'input' ? 'dialogs.open' : `dialogs.${kind}`);
    try {
      const options = { title: t('Dialog 결과'), okText: t('확인'), cancelText: t('취소') };
      const actions = {
        alert: async () => {
          await dialogs.alert(t('메시지를 확인해 주세요.'), options);
          return 'closed';
        },
        confirm: () => dialogs.confirm(t('계속 진행하시겠습니까?'), options),
        input: async () => (await dialogs.open(InputDialog, { initialValue: '' })) ?? null,
      };
      setResult(await actions[kind]());
      setSettled(true);
    } catch (cause) {
      if (!(cause instanceof Error)) throw cause;
      setError(cause.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Button variant="outlined" disabled={pending} onClick={() => void open()}>
        {t(buttonLabels[kind])}
      </Button>
      {error && (
        <Alert severity="error">
          <strong>{t('Dialog를 열지 못했습니다.')}</strong>
          <div>{error}</div>
        </Alert>
      )}
      <ExampleResult value={{ result, settled, pending }} />
    </Stack>
  );
}
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <OwpDialogsProvider>
      <>
        <ExampleSection
          title="알림을 닫은 뒤 계속하기"
          description="alert의 Promise는 확인 버튼으로 창을 닫으면 완료됩니다."
        >
          <DialogSample id="alert" kind="alert" report={report} onRecord={onRecord} />
        </ExampleSection>
        <ExampleSection
          title="확인과 취소 결과"
          description="confirm은 확인하면 true, 취소하면 false를 반환합니다."
        >
          <DialogSample id="confirm" kind="confirm" report={report} onRecord={onRecord} />
        </ExampleSection>
        <ExampleSection
          title="입력값과 취소 결과"
          description="dialogs.open으로 custom OwpDialog를 엽니다. 예제의 확인 버튼은 입력 문자열을, 취소는 null을 전달합니다."
        >
          <DialogSample id="input" kind="input" report={report} onRecord={onRecord} />
        </ExampleSection>
      </>
    </OwpDialogsProvider>
  );
}
