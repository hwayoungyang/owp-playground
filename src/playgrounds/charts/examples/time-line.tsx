import { useChartPalette } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData } from '../model/chartTypes';
import { createTimeOptions, equipmentReadings } from '../model/timeScaleData';
import type { ChartExampleProps } from '../model/types';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';
import { TimeChart } from '../runtime/TimeChart';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [spacing, setSpacing] = useState('실제 시간 간격');
  const axis = spacing === '동일한 관측 간격' ? 'timeseries' : 'time';
  const data: NativeData = {
    labels: equipmentReadings.map((point) => new Date(point.x).toISOString()),
    datasets: [
      {
        id: 'equipment-load',
        label: t('설비 부하 (%)'),
        data: equipmentReadings,
        borderColor: palette.colors[0],
        backgroundColor: palette.colors[0],
        borderWidth: 2,
        pointRadius: 4,
        tension: 0,
      },
    ],
  };
  return (
    <>
      <Controls>
        <Choice
          label="시간축 간격"
          value={spacing}
          options={['실제 시간 간격', '동일한 관측 간격']}
          onChange={setSpacing}
        />
      </Controls>
      <TimeChart>
        <ChartCanvas
          type="line"
          data={data}
          options={createTimeOptions(i18n.language, axis)}
          {...props}
        />
      </TimeChart>
      <p className="chart-note">
        {t(
          '불규칙한 설비 관측 시각을 time의 실제 간격과 timeseries의 동일 간격으로 비교합니다. 모든 시각은 UTC입니다.',
        )}
      </p>
    </>
  );
}
