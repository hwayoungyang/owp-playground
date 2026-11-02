import { useEffect, useId, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useDialogOpenFocusCleanup, useOwpTranslation } from '@owp/components/hooks';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function FocusSample({
  id,
  fromInput,
  report,
  onRecord,
}: SectionObserver & { readonly fromInput: boolean }) {
  const { t } = useOwpTranslation();
  const titleId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [requested, setRequested] = useState(false);
  const open = useDialogOpenFocusCleanup(requested);
  useEffect(() => {
    report(id, { requested, open });
  }, [report, id, requested, open]);
  function request() {
    setRequested(true);
    onRecord(`${id}.open`, fromInput ? 'input.enter' : 'button.click');
  }
  return (
    <Stack spacing={2}>
      {fromInput ? (
        <>
          <TextField
            inputRef={input}
            size="small"
            label={t('포커스 확인 입력')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') request();
            }}
            helperText={t('입력에 포커스를 두고 Enter를 누르세요.')}
          />
          <Button variant="outlined" onClick={() => input.current?.focus()}>
            {t('입력에 포커스')}
          </Button>
        </>
      ) : (
        <Button variant="outlined" onClick={request}>
          {t('Dialog 열기')}
        </Button>
      )}
      <ExampleResult value={{ requested, open }} />
      <Dialog
        open={open}
        onClose={() => setRequested(false)}
        aria-labelledby={titleId}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id={titleId}>{t('포커스 이동 확인')}</DialogTitle>
        <DialogContent>
          {t('기존 활성 요소를 blur한 뒤 Dialog의 버튼으로 포커스를 옮깁니다.')}
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => {
              setRequested(false);
              onRecord(`${id}.close`, 'closed');
            }}
          >
            {t('닫기')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <>
      <ExampleSection
        title="버튼에서 Dialog 열기"
        description="버튼 클릭으로 open을 요청하고 Hook이 반환한 값을 Dialog에 전달합니다."
      >
        <FocusSample id="button" fromInput={false} report={report} onRecord={onRecord} />
      </ExampleSection>
      <ExampleSection
        title="입력에서 Dialog 열기"
        description="입력의 Enter 이벤트로 열어도 기존 활성 요소를 blur한 뒤 Dialog를 표시합니다."
      >
        <FocusSample id="input" fromInput report={report} onRecord={onRecord} />
      </ExampleSection>
    </>
  );
}
