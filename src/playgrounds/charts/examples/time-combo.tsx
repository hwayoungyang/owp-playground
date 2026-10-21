import { useChartPalette } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import {
  createTimeOptions,
  hourInMilliseconds,
  productionReadings,
  timeOrigin,
} from '../model/timeScaleData';
import type { ChartExampleProps } from '../model/types';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';
import { TimeChart } from '../runtime/TimeChart';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [plan, setPlan] = useState(true);
  const [points, setPoints] = useState(true);
  const data: NativeData = {
    labels: productionReadings.map((point) => new Date(point.x).toISOString()),
    datasets: [
      {
        id: 'hourly-production',
        type: 'bar',
        label: t('시간당 생산량'),
        data: productionReadings.map(({ x, actual }) => ({ x, y: actual })),
        backgroundColor: palette.colors[0],
        maxBarThickness: 36,
        borderRadius: 4,
        order: 1,
      },
      ...(plan
        ? [
            {
              id: 'hourly-production-plan',
              type: 'line' as const,
              label: t('시간당 생산 계획'),
              data: productionReadings.map(({ x, plan: y }) => ({ x, y })),
              borderColor: palette.colors[1],
              backgroundColor: palette.colors[1],
              borderWidth: 2,
              pointRadius: points ? 3 : 0,
              tension: 0,
              order: 0,
            },
          ]
        : []),
    ],
  };
  const base = createTimeOptions(i18n.language, 'time');
  const options: NativeOptions = {
    ...base,
    scales: {
      ...base.scales,
      x: {
        ...base.scales?.x,
        min: timeOrigin - hourInMilliseconds / 2,
        max: timeOrigin + 11.5 * hourInMilliseconds,
      },
      y: { beginAtZero: true },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="생산 계획 표시" value={plan} onChange={setPlan} />
        <Toggle label="계획 관측점 표시" value={points} onChange={setPoints} />
      </Controls>
      <TimeChart>
        <ChartCanvas type="bar" data={data} options={options} {...props} />
      </TimeChart>
      <p className="chart-note">
        {t('같은 UTC 시간축에서 생산 실적 Column과 생산 계획 Line을 비교합니다.')}
      </p>
    </>
  );
}
