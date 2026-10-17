import { Button, useMediaQuery } from '@mui/material';
import { ChartFrame } from '@owp/charts';
import { createGaugeChartData, createGaugeChartOptions } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useRef, useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';
import { useAvailableChartHeight } from '../runtime/useAvailableChartHeight';
import { usePageVisible } from '../runtime/usePageVisible';

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [value, setValue] = useState(76);
  const [running, setRunning] = useState(true);
  const visible = usePageVisible();
  const sequence = useRef(0);
  useEffect(() => {
    if (!running || !visible) return;
    const timer = window.setInterval(() => {
      sequence.current += 1;
      setValue(Math.round(30 + 60 * Math.sin(sequence.current * 0.72 + 0.87)));
    }, 1500);
    return () => window.clearInterval(timer);
  }, [running, visible]);
  const plot = useAvailableChartHeight();
  const bands = [
    { from: -40, to: 0, label: t('주의'), color: palette.danger },
    { from: 0, to: 40, label: t('기반'), color: palette.warning },
    { from: 40, to: 80, label: t('우수'), color: palette.colors[2] ?? palette.ink },
    { from: 80, to: 100, label: t('탁월'), color: palette.success },
  ];
  const data = createGaugeChartData({
    min: -40,
    max: 100,
    bands,
    datasetOptions: { spacing: 2, borderRadius: 4 },
  });
  const options = createGaugeChartOptions({
    min: -40,
    max: 100,
    value,
    radius: '100%',
    layout: { padding: { left: 32, right: 32, top: 24, bottom: 28 } },
    motion: reducedMotion || !visible ? false : { duration: 500, respectReducedMotion: true },
    ticks: { stepSize: 20, color: palette.muted, fontSize: 12, fontFamily: palette.fontFamily },
    bandLabels: { color: palette.ink, fontSize: 14, fontFamily: palette.fontFamily },
    needle: { color: 'auto', hubRadius: 8, baseWidth: 12, tailLengthRatio: 0 },
    valueLabel: {
      color: palette.ink,
      backgroundColor: palette.surface,
      fontSize: 22,
      radius: 24,
      fontFamily: palette.fontFamily,
      formatter: (next) => String(Math.round(next)),
    },
  });
  useEffect(
    () =>
      onData?.({
        labels: [t('운영지수')],
        series: [{ label: t('현재 값'), values: [value] }],
      }),
    [value, onData, t],
  );
  return (
    <>
      <Controls>
        <Button variant="outlined" onClick={() => setRunning((current) => !current)}>
          {t(running ? '일시정지' : '다시 시작')}
        </Button>
        <span className="chart-note" role="status">
          {t(running ? '실시간 갱신 중' : '일시정지됨')}
        </span>
        <Range
          label="게이지 값"
          value={value}
          min={-40}
          max={100}
          onChange={(next) => {
            setRunning(false);
            setValue(next);
          }}
        />
      </Controls>
      <div ref={plot} className="chart-canvas chart-canvas-gauge">
        <ChartFrame
          aria-label={t('운영지수 게이지')}
          data={data}
          options={options}
          externalTooltip
          type="doughnut"
          height="100%"
          legend={false}
          interactionLayer={false}
          zoomSlider={false}
        />
      </div>
    </>
  );
}
