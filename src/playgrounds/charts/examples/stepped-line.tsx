import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import { processReadings } from '../model/referenceData';
import type { ChartExampleProps } from '../model/types';
import { useCartesian } from '../model/useCartesian';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const [mode, setMode] = useState<'before' | 'after' | 'middle'>('before');
  const dates = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
  const chart = useCartesian(
    {
      records: processReadings.map(({ timestamp, value }) => ({
        category: dates.format(timestamp),
        value,
      })),
      series: [
        {
          dataKey: 'value',
          label: t('치수 편차 (mm)'),
          type: 'line',
          datasetOptions: { stepped: mode, tension: 0, pointRadius: 0, borderWidth: 2 },
        },
      ],
      options: {
        scales: {
          x: {
            type: 'category',
            ticks: { autoSkip: true, autoSkipPadding: 20, maxTicksLimit: 8, maxRotation: 0 },
          },
          y: { min: -0.5, max: 0.6, ticks: { stepSize: 0.2 } },
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Choice
          label="표시 방식"
          value={mode}
          options={['before', 'after', 'middle']}
          onChange={setMode}
        />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="line"
          {...chart}
          height="100%"
          zoomSlider={{ x: { position: 'bottom' } }}
        />
      </div>
    </>
  );
}
