import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data, palette } = useNativeData('line');
  const [scale, setScale] = useState<'로그 축' | '선형 축'>('로그 축');
  const values = [
    [0.8, 7.2, 36, 180, 920, 4800],
    [1.2, 5.4, 48, 140, 1100, 3900],
  ];
  const chartData: NativeData = {
    labels: ['검사', '세척', '가공', '건조', '열처리', '용해'].map((label) => t(label)),
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      data: values[index] ?? [],
      tension: 0,
    })),
  };
  const options: NativeOptions = {
    plugins: {
      title: { display: true, text: t('공정별 배치 전력 사용량'), color: palette.ink },
      tooltip: {
        callbacks: {
          label: (context) =>
            t('{{series}}: {{value}} kWh', {
              series: context.dataset.label,
              value: context.parsed.y,
            }),
        },
      },
    },
    scales: {
      x: { title: { display: true, text: t('공정'), color: palette.ink } },
      y: {
        type: scale === '로그 축' ? 'logarithmic' : 'linear',
        beginAtZero: scale === '선형 축',
        title: { display: true, text: t('배치 전력 사용량 (kWh)'), color: palette.ink },
      },
    },
  };
  return (
    <>
      <Controls>
        <Choice
          label="Y축 척도"
          value={scale}
          options={['로그 축', '선형 축']}
          onChange={setScale}
        />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
