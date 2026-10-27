import { useEffect, useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { useDiscardGuard } from '@owp/components/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';

export function CoreExample({ onData, onRecord }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [pending, setPending] = useState(false);
  const isDirty = draft.length > 0;
  const guard = useDiscardGuard(isDirty);

  useEffect(() => {
    onData({ draft, isDirty, isEditing, pending });
  }, [draft, isDirty, isEditing, pending, onData]);

  async function closeEditor() {
    setPending(true);
    try {
      const accepted = await guard.requestDiscard(
        () => {
          setDraft('');
          setIsEditing(false);
        },
        { intent: 'close' },
      );
      onRecord('discard.result', String(accepted));
    } finally {
      setPending(false);
    }
  }

  return (
    <CoreDemo>
      <DemoSection description="메모를 수정한 뒤 닫기를 누르면 저장하지 않은 변경을 확인합니다. 계속 편집을 선택하면 입력이 유지되고, 닫기를 승인하면 예제에서 메모를 비우고 편집 영역을 닫습니다.">
        {isEditing ? (
          <>
            <TextField
              label={t('샘플 메모')}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              size="small"
              fullWidth
            />
            <div className="core-controls">
              <Button variant="outlined" disabled={pending} onClick={() => void closeEditor()}>
                {t('닫기')}
              </Button>
            </div>
            <Typography role="status">
              {t(isDirty ? '저장하지 않은 변경 사항이 있습니다.' : '변경 사항이 없습니다.')}
            </Typography>
          </>
        ) : (
          <>
            <Typography role="status">{t('메모 편집을 닫았습니다.')}</Typography>
            <div className="core-controls">
              <Button variant="outlined" onClick={() => setIsEditing(true)}>
                {t('다시 열기')}
              </Button>
            </div>
          </>
        )}
        {guard.confirmation}
      </DemoSection>
    </CoreDemo>
  );
}
