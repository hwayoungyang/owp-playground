import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';

const outputs = [230, 375, 435, 350, 480, 390, 350, 240, 210, 350, 605, 510, 425, 420] as const;
const temperatures = [82, 77, 65, 58, 42, 57, 56, 55, 64, 71, 79, 80, 82, 73] as const;
const durations = [410, 490, 560, 380, 500, 440, 405, 310, 290, 480, 890, 810, 685, 485] as const;

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const [temperature, setTemperature] = useState(false);
  const dates = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
  const time = (value: number) =>
    `${Math.floor(value / 60)
      .toString()
      .padStart(2, '0')}:${Math.round(value % 60)
      .toString()
      .padStart(2, '0')}`;
  const chart = useCartesian(
    {
      records: outputs.map((output, index) => ({
        category: dates.format(Date.UTC(2026, 0, index + 1)),
        output,
        temperature: temperatures[index] ?? 0,
        duration: durations[index] ?? 0,
      })),
      series: [
        {
          dataKey: 'output',
          label: t('생산량 (개)'),
          type: 'bar',
          yAxisId: 'output',
          order: 2,
          datasetOptions: { borderRadius: 0, maxBarThickness: 52 },
        },
        {
          dataKey: 'temperature',
          label: t('설비 온도 (°C)'),
          type: 'line',
          yAxisId: 'temperature',
          order: 0,
          datasetOptions: {
            backgroundColor: 'transparent',
            pointRadius: 5,
            pointBorderWidth: 2,
            tension: 0,
          },
        },
        {
          dataKey: 'duration',
          label: t('가동시간'),
          type: 'line',
          yAxisId: 'duration',
          order: 1,
          datasetOptions: { pointStyle: 'rect', pointRadius: 4, tension: 0 },
        },
      ],
      options: {
        scales: {
          x: {
            type: 'category',
            ticks: { autoSkip: true, autoSkipPadding: 20, maxTicksLimit: 7, maxRotation: 0 },
          },
          output: { type: 'linear', position: 'left', min: 0, max: 700 },
          temperature: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            display: temperature,
            grid: { drawOnChartArea: false },
          },
          duration: {
            type: 'linear',
            position: 'right',
            min: 240,
            max: 1080,
            grid: { drawOnChartArea: false },
            ticks: { stepSize: 120, callback: (value) => time(Number(value)) },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (item) =>
                `${item.dataset.label}: ${item.dataset.yAxisID === 'duration' ? time(item.parsed.y ?? 0) : item.formattedValue}`,
            },
          },
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Toggle label="온도 축 표시" value={temperature} onChange={setTemperature} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="bar"
          {...chart}
          height="100%"
          zoomSlider={{ x: { position: 'bottom' } }}
        />
      </div>
    </>
  );
}
