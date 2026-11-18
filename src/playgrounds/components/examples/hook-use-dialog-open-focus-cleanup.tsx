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
import { OwpDialogsProvider } from '@owp/components/feedback';
import {
  useDialogOpenFocusCleanup,
  useOwpDialogs,
  useOwpTranslation,
} from '@owp/components/hooks';
import type { DialogProps } from '@owp/components/types';
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
type ManagedCloseResult = 'entered-before-close' | 'entered-after-close';

function ManagedFocusDialog({ open: requested, onClose, onEntered, payload }: DialogProps<
  { readonly record: (event: string) => void },
  ManagedCloseResult
>) {
  const { t } = useOwpTranslation();
  const titleId = useId();
  const open = useDialogOpenFocusCleanup(requested);

  function completeBeforeClose() {
    payload.record('transition.onEntered');
    onEntered?.();
    void onClose('entered-before-close');
  }

  function completeAfterClose() {
    payload.record('close.start');
    const closing = onClose('entered-after-close');
    // 같은 이벤트에서 지연된 transition 완료를 재현합니다. 전달 여부는 manager가 판단합니다.
    payload.record('transition.onEntered');
    onEntered?.();
    void closing;
  }

  return (
    <Dialog open={open} aria-labelledby={titleId} onClose={() => void onClose()} fullWidth maxWidth="xs">
      <DialogTitle id={titleId}>{t('Dialog 열기 완료 전달')}</DialogTitle>
      <DialogActions>
        <Button onClick={completeBeforeClose}>{t('열기 완료 후 닫기')}</Button>
        <Button onClick={completeAfterClose}>{t('닫기 시작 후 열기 완료 전달')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ManagedFocusSample({ id, report, onRecord }: SectionObserver) {
  const { t } = useOwpTranslation();
  const dialogs = useOwpDialogs({ strictPayload: true });
  const [events, setEvents] = useState<readonly string[]>([]);

  async function request() {
    const nextEvents: string[] = [];
    const record = (event: string) => {
      nextEvents.push(event);
      onRecord(`${id}.${event}`, event);
    };
    record('open');
    const result = await dialogs.open(ManagedFocusDialog, { record }, {
      onEntered: () => record('consumer.onEntered'),
    });
    record('closed');
    setEvents(nextEvents);
    report(id, { result, events: nextEvents });
  }

  return (
    <Stack spacing={2} alignItems="flex-start">
      <Button variant="outlined" onClick={() => void request()}>{t('Dialog 열기')}</Button>
      <ExampleResult value={{ events }} />
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
      <ExampleSection
        title="닫기 시작과 늦은 onEntered"
        description="열기 완료 후 닫으면 consumer.onEntered가 기록됩니다. 닫기를 먼저 시작하면 transition.onEntered를 전달해도 consumer.onEntered는 실행되지 않습니다."
      >
        <OwpDialogsProvider>
          <ManagedFocusSample id="late-enter" report={report} onRecord={onRecord} />
        </OwpDialogsProvider>
      </ExampleSection>
    </>
  );
}
