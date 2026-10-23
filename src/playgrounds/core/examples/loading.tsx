import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { OwpLoading } from '@owp/core';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreChoice, CoreToggle } from '../runtime/Controls';
import { CoreDemo, DemoSection } from '../runtime/Demo';

const variants = ['beat', 'fade', 'linear', 'propagate', 'pulse', 'rotate', 'sync'] as const;
const sizes = [8, 12, 16] as const;

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [variant, setVariant] = useState<(typeof variants)[number]>('beat');
  const [size, setSize] = useState<(typeof sizes)[number]>(12);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    onData({ variant, size, visible });
  }, [variant, size, visible, onData]);

  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice
            label="로딩 형태"
            value={variant}
            options={variants}
            onChange={(value) => {
              setVariant(value);
              onRecord('variant', value);
            }}
          />
          {variant !== 'linear' && variant !== 'fade' && (
            <CoreChoice label="크기 (px)" value={size} options={sizes} onChange={setSize} />
          )}
          <CoreToggle
            label="로딩 표시"
            value={visible}
            onChange={(value) => {
              setVisible(value);
              onRecord('visible', String(value));
            }}
          />
        </>
      }
    >
      <DemoSection>
        <Box
          sx={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-busy={visible}
        >
          {visible ? (
            <OwpLoading variant={variant} size={size} ariaLabel={t('로딩 중')} />
          ) : (
            <Typography role="status">{t('로딩 표시가 꺼져 있습니다.')}</Typography>
          )}
        </Box>
      </DemoSection>
    </CoreDemo>
  );
}
