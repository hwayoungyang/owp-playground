import { useEffect, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { OwpDialog } from '@owp/components';
import { useDiscardGuard, useOwpTranslation } from '@owp/components/hooks';
import { ExampleSection } from '../runtime/ExampleSection';
import type { ComponentsExampleProps } from '../model/types';

export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [saved, setSaved] = useState('샘플 항목');
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState(false);
  const dirty = draft !== saved;
  const guard = useDiscardGuard(dirty);
  useEffect(() => {
    onData({ saved, draft, open, dirty });
  }, [saved, draft, open, dirty, onData]);
  return (
    <>
      <ExampleSection
        title="저장한 값과 편집 중인 값"
        description="저장은 이 예제의 상태에만 반영합니다. 편집 창에서 저장하지 않고 닫으면 변경 내용을 버릴지 확인합니다."
      >
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography>{t('저장한 항목명: {{value}}', { value: saved })}</Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setDraft(saved);
              setOpen(true);
              onRecord('edit.open', saved);
            }}
          >
            {t('항목명 편집')}
          </Button>
        </Stack>
        <OwpDialog
          open={open}
          title={t('항목명 편집')}
          confirmText={t('저장')}
          cancelText={t('닫기')}
          fullWidth
          maxWidth="sm"
          discardGuard={guard}
          onClose={() => {
            setOpen(false);
            onRecord('edit.close', 'discard');
          }}
          onCancel={() => {
            setOpen(false);
            onRecord('edit.cancel', 'discard');
          }}
          onConfirm={() => {
            setSaved(draft);
            setOpen(false);
            onRecord('edit.save', draft);
          }}
        >
          <TextField
            label={t('항목명')}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
        </OwpDialog>
      </ExampleSection>
      <ExampleSection
        title="닫기 동작의 차이"
        description="입력값을 바꾸지 않았다면 바로 닫습니다. 변경했다면 계속 편집하거나 변경 내용을 버리고 닫을 수 있습니다."
      >
        <Typography variant="body2">
          {t('저장 버튼은 입력값을 반영하고 닫기 버튼은 미저장 변경을 확인합니다.')}
        </Typography>
      </ExampleSection>
    </>
  );
}
