import { Alert, Button } from '@mui/material';
import type { ChartFrameExportHandle } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useRef, useState } from 'react';
import type { NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data, palette } = useNativeData('bar');
  const exportRef = useRef<ChartFrameExportHandle>(null);
  const [visible, setVisible] = useState(true);
  const [multiline, setMultiline] = useState(false);
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = t('상반기 생산량');
  const subtitle = t('라인 A와 라인 B의 월별 생산 실적');
  const detail = t('단위: 개 · 집계: 월별');
  const ariaLabel = visible
    ? multiline
      ? t('{{title}}. {{subtitle}}. {{detail}}. 데이터 탭에서 값을 확인할 수 있습니다.', {
          title,
          subtitle,
          detail,
        })
      : t('{{title}}. {{subtitle}}. 데이터 탭에서 값을 확인할 수 있습니다.', { title, subtitle })
    : t('{{title}}. 데이터 탭에서 값을 확인할 수 있습니다.', { title });
  const options: NativeOptions = {
    plugins: {
      title: { display: true, text: title, color: palette.ink },
      subtitle: {
        display: visible,
        text: multiline ? [subtitle, detail] : subtitle,
        align,
        color: palette.ink,
        font: { size: 12 },
        padding: { bottom: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: t('생산량 (개)'), color: palette.ink },
      },
    },
  };
  const download = async () => {
    const handle = exportRef.current;
    if (!handle) return;
    setBusy(true);
    setError('');
    try {
      await handle.downloadPng('production-subtitle');
      props.onRecord?.('export', 'download');
    } catch (cause) {
      if (cause instanceof Error) setError('이미지를 저장하지 못했습니다. 다시 시도해 주세요.');
      else throw cause;
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Controls>
        <Toggle label="부제목 표시" value={visible} onChange={setVisible} />
        <Toggle label="여러 줄 부제목" value={multiline} onChange={setMultiline} />
        <Choice
          label="부제목 정렬"
          value={align}
          options={['start', 'center', 'end']}
          onChange={setAlign}
        />
        <Button variant="outlined" disabled={busy} onClick={() => void download()}>
          {t('PNG 저장')}
        </Button>
      </Controls>
      {error && <Alert severity="error">{t(error)}</Alert>}
      <ChartCanvas
        type="bar"
        data={data}
        options={options}
        exportRef={exportRef}
        ariaLabel={ariaLabel}
        {...props}
      />
    </>
  );
}
