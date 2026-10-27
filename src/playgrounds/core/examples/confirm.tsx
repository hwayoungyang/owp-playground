import { useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useConfirm, useOwpDialogs } from '@owp/components/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';

const resultLabels = {
  confirmed: '확인했습니다.',
  canceled: '취소했습니다.',
  alerted: '알림을 닫았습니다.',
} as const;

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const dialogs = useOwpDialogs();
  const confirmations = useConfirm();
  const [kind, setKind] = useState<'confirmSave' | 'confirmUpdate' | 'confirmDelete'>(
    'confirmSave',
  );
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<keyof typeof resultLabels | null>(null);

  useEffect(() => {
    onData({ pending, result });
  }, [onData, pending, result]);

  async function openConfirm() {
    setPending(true);
    onRecord('confirm.open', kind);
    try {
      const accepted = await confirmations[kind]({
        okText: t('확인'),
        cancelText: t('취소'),
      });
      setResult(accepted ? 'confirmed' : 'canceled');
      onRecord('confirm.close', String(accepted));
    } finally {
      setPending(false);
    }
  }

  async function openAlert() {
    setPending(true);
    onRecord('alert.open', 'dialogs.alert');
    try {
      await dialogs.alert(t('변경 내용을 확인했습니다.'), { title: t('알림'), okText: t('확인') });
      setResult('alerted');
      onRecord('alert.close', 'closed');
    } finally {
      setPending(false);
    }
  }

  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice
            label="확인 동작"
            value={kind}
            options={['confirmSave', 'confirmUpdate', 'confirmDelete']}
            onChange={setKind}
          />
          <Button variant="outlined" disabled={pending} onClick={() => void openConfirm()}>
            {t('확인 창 열기')}
          </Button>
          <Button variant="outlined" disabled={pending} onClick={() => void openAlert()}>
            {t('알림 창 열기')}
          </Button>
        </>
      }
    >
      <DemoSection>
        <Alert severity={result === 'confirmed' ? 'success' : 'info'} role="status">
          {result === null ? t('아직 확인 결과가 없습니다.') : t(resultLabels[result])}
        </Alert>
      </DemoSection>
    </CoreDemo>
  );
}
