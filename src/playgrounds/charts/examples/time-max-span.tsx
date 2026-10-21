import { useChartPalette } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import {
  createTimeOptions,
  hourInMilliseconds,
  sensorGapReadings,
  timeOrigin,
} from '../model/timeScaleData';
import type { ChartExampleProps } from '../model/types';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';
import { TimeChart } from '../runtime/TimeChart';

const gapHours: Record<string, number> = { '1시간': 1, '4시간': 4, '8시간': 8 };

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [threshold, setThreshold] = useState('4시간');
  const data: NativeData = {
    labels: sensorGapReadings.map((point) => new Date(point.x).toISOString()),
    datasets: [
      {
        id: 'sensor-temperature-with-gaps',
        label: t('센서 온도 (°C)'),
        data: sensorGapReadings,
        borderColor: palette.colors[0],
        backgroundColor: palette.colors[0],
        borderWidth: 2,
        pointRadius: 4,
        tension: 0,
        spanGaps: (gapHours[threshold] ?? 4) * hourInMilliseconds,
      },
    ],
  };
  const base = createTimeOptions(i18n.language, 'time');
  const options: NativeOptions = {
    ...base,
    scales: {
      ...base.scales,
      x: { ...base.scales?.x, min: timeOrigin, max: timeOrigin + 16.5 * hourInMilliseconds },
      y: { min: 55, max: 80 },
    },
  };
  return (
    <>
      <Controls>
        <Choice
          label="최대 연결 시간"
          value={threshold}
          options={['1시간', '4시간', '8시간']}
          onChange={setThreshold}
        />
      </Controls>
      <TimeChart>
        <ChartCanvas type="line" data={data} options={options} {...props} />
      </TimeChart>
      <p className="chart-note">
        {t(
          'spanGaps에 밀리초 단위의 최대 연결 시간을 전달합니다. null 구간은 연결하지 않고, 인접 관측 시각의 간격이 임계값보다 크면 선을 추가로 끊습니다. UTC 시각과 누락값은 데이터 탭에 그대로 남습니다.',
        )}
      </p>
    </>
  );
}
