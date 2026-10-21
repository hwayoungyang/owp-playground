import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ChartFrame } from '@owp/charts';
import type { ChartFrameExportHandle } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useRef, useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian } from '../model/useCartesian';
import { Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const exportRef = useRef<ChartFrameExportHandle>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previewUrl = useRef<string | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const chart = useCartesian({}, props);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);
  const closePreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  };
  const run = async (action: 'download' | 'preview') => {
    const handle = exportRef.current;
    if (!handle || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (action === 'download') await handle.downloadPng('production-chart');
      else {
        const blob = await handle.toPngBlob({ pixelRatio: 2 });
        if (mounted.current) {
          if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
          const url = URL.createObjectURL(blob);
          previewUrl.current = url;
          setPreview(url);
        }
      }
      if (mounted.current) props.onRecord?.('export', action);
    } catch (cause) {
      if (cause instanceof Error) {
        if (mounted.current) setError('이미지를 저장하지 못했습니다. 다시 시도해 주세요.');
      } else throw cause;
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <>
      <Controls>
        <Button variant="outlined" disabled={busy} onClick={() => void run('download')}>
          {t('PNG 저장')}
        </Button>
        <Button variant="outlined" disabled={busy} onClick={() => void run('preview')}>
          {t('PNG 미리보기')}
        </Button>
      </Controls>
      {error && <Alert severity="error">{t(error)}</Alert>}
      <div className="chart-canvas">
        <ChartFrame
          {...chart}
          type="bar"
          height="100%"
          exportRef={exportRef}
          showExportButton={false}
        />
      </div>
      <Dialog open={preview !== null} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>{t('PNG 미리보기')}</DialogTitle>
        <DialogContent>
          {preview && (
            <img
              className="chart-png-preview"
              src={preview}
              alt={t('내보낸 생산량 차트')}
              width={1200}
              height={700}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>{t('닫기')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
