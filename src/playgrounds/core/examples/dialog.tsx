import { useEffect, useId, useState } from 'react';
import { Button, TextField } from '@mui/material';
import { OwpDialog, OwpFieldTable } from '@owp/core';
import { useOwpDialogs } from '@owp/core/hooks';
import type { DialogProps } from '@owp/core/types';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreToggle } from '../runtime/Controls';
import { CoreDemo, DemoSection } from '../runtime/Demo';

type EditItemPayload = {
  readonly name: string;
  readonly protectChanges: boolean;
};

export function EditItemDialog({ open, onClose, payload }: DialogProps<EditItemPayload, string>) {
  const { t } = useOwpTranslation();
  const id = useId();
  const [name, setName] = useState(payload.name);

  return (
    <OwpDialog
      open={open}
      title={<span id={id}>{t('항목 편집')}</span>}
      aria-labelledby={id}
      maxWidth="sm"
      isDirty={payload.protectChanges && name !== payload.name}
      submitOnConfirm
      confirmText={t('저장')}
      cancelText={t('닫기')}
      onClose={() => void onClose()}
      onSubmit={(event) => {
        event.preventDefault();
        const value = name.trim();
        if (value) void onClose(value);
      }}
    >
      <div className="core-field">
        <TextField
          autoFocus
          required
          fullWidth
          size="small"
          label={t('이름')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
      </div>
    </OwpDialog>
  );
}

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const dialogs = useOwpDialogs();
  const [protectChanges, setProtectChanges] = useState(true);
  const [savedName, setSavedName] = useState('Item A');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    onData({ protectChanges, editing, savedName });
  }, [protectChanges, editing, savedName, onData]);

  async function openEditor() {
    setEditing(true);
    onRecord('open', savedName);
    try {
      const result = await dialogs.open(EditItemDialog, {
        name: savedName,
        protectChanges,
      });
      if (result !== undefined) {
        setSavedName(result);
        onRecord('save', result);
      } else {
        onRecord('close', t('편집 창을 닫았습니다.'));
      }
    } finally {
      setEditing(false);
    }
  }

  return (
    <CoreDemo
      controls={
        <>
          <CoreToggle
            label="미저장 변경 확인"
            value={protectChanges}
            onChange={setProtectChanges}
          />
        </>
      }
    >
      <DemoSection>
        <Button variant="outlined" disabled={editing} onClick={() => void openEditor()}>
          {t('편집 창 열기')}
        </Button>
        <OwpFieldTable
          layout={[[{ title: t('저장된 이름'), key: 'name' }]]}
          data={{ name: savedName }}
          titleWidth={120}
        />
      </DemoSection>
    </CoreDemo>
  );
}
