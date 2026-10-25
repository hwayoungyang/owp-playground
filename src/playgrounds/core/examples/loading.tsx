import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { OwpLoading } from '@owp/components';
import { useGetPageLockLoading, usePageLockLoading } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { runFailedPageLockTask, startBoundedPageLockTask } from '../model/policy';
import type { CoreExampleProps } from '../model/types';
import { CoreChoice, CoreToggle } from '../runtime/Controls';
import { CoreDemo, DemoSection } from '../runtime/Demo';

const variants = ['beat', 'fade', 'linear', 'propagate', 'pulse', 'rotate', 'sync'] as const;
const sizes = [8, 12, 16] as const;
const LOCK_DURATION_MS = 600;

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const pageLock = useGetPageLockLoading();
  const { setLoading } = usePageLockLoading();
  const [variant, setVariant] = useState<(typeof variants)[number]>('beat');
  const [size, setSize] = useState<(typeof sizes)[number]>(12);
  const [visible, setVisible] = useState(true);
  const [lockOutcome, setLockOutcome] = useState('대기 중');
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setLoading({ loading: false });
    },
    [setLoading],
  );

  useEffect(() => {
    onData({
      variant,
      size,
      visible,
      pageLockLoading: Boolean(pageLock.loading),
      pageLockTitle: pageLock.title ?? null,
      lockOutcome,
    });
  }, [variant, size, visible, pageLock.loading, pageLock.title, lockOutcome, onData]);

  function runBoundedPageLock() {
    startBoundedPageLockTask({
      title: t('작업 처리 중...'),
      durationMs: LOCK_DURATION_MS,
      timerRef,
      setLoading,
      setOutcome: setLockOutcome,
      onRecord,
    });
  }

  function simulateFailedLockTask() {
    runFailedPageLockTask({
      title: t('작업 처리 중...'),
      timerRef,
      setLoading,
      setOutcome: setLockOutcome,
      onRecord,
    });
  }

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
      <DemoSection
        title="화면 잠금 로딩 정책"
        description="OwpLoading은 @owp/components의 순수 UI 컴포넌트이고, usePageLockLoading은 OwpUiProvider의 화면 잠금 Backdrop을 제어합니다. 완료·실패·unmount 시 잠금을 해제합니다."
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            disabled={Boolean(pageLock.loading)}
            onClick={runBoundedPageLock}
          >
            {t('화면 잠금 실행')}
          </Button>
          <Button variant="outlined" size="small" onClick={simulateFailedLockTask}>
            {t('실패 후 잠금 해제')}
          </Button>
          <Typography role="status" variant="body2">
            {pageLock.loading ? t('화면 잠금 실행 중') : t(lockOutcome)}
          </Typography>
        </Box>
      </DemoSection>
    </CoreDemo>
  );
}
