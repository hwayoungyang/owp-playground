import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import { forecastOutput, observedOutput } from '../model/forecastData';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [forecast, setForecast] = useState(true);
  const date = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
  const data: NativeData = {
    labels: Array.from({ length: 365 }, (_, day) => date.format(Date.UTC(2026, 0, 1 + day))),
    datasets: [
      {
        id: 'observed',
        label: t('관측 생산량'),
        data: Array.from({ length: 365 }, (_, index) => observedOutput[index] ?? null),
        borderColor: palette.colors[0],
        backgroundColor: palette.colors[0],
        borderWidth: 2,
        pointRadius: 0,
      },
      ...['기본 예측', '설비 증설 시나리오', '보수적 운영 시나리오'].map((name, scenario) => ({
        id: `forecast-${scenario}`,
        label: t(name),
        data: Array.from({ length: 365 }, (_, day) =>
          day < 181 ? null : (forecastOutput[scenario]?.[day - 181] ?? null),
        ),
        borderColor: palette.colors[[0, 3, 1][scenario] ?? 0],
        backgroundColor: palette.colors[[0, 3, 1][scenario] ?? 0],
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 0,
        hidden: !forecast,
      })),
    ],
  };
  const options: NativeOptions = {
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        type: 'category',
        ticks: { autoSkip: true, autoSkipPadding: 20, maxTicksLimit: 7, maxRotation: 0 },
      },
      y: { beginAtZero: true, title: { display: true, text: t('누적 생산량 (개)') } },
    },
    plugins: { tooltip: { filter: (item) => item.raw !== null } },
  };
  return (
    <>
      <Controls>
        <Toggle label="예측 시나리오 표시" value={forecast} onChange={setForecast} />
      </Controls>
      <ChartCanvas type="line" data={data} options={options} {...props} />
    </>
  );
}
