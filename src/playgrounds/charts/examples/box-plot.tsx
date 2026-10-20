import { alpha } from '@mui/material/styles';
import { OwpBoxPlotChart, useChartPalette } from '@owp/charts';
import type { BoxPlotData, OwpBoxPlotChartProps } from '@owp/charts/types';
import { createBoxPlotTooltipCallbacks, summarizeBox } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import { chartMotion } from '../model/chartMotion';
import { factoryNoise } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { Controls, Toggle } from '../runtime/Controls';
import { useAvailableChartHeight } from '../runtime/useAvailableChartHeight';

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [outliers, setOutliers] = useState(true);
  const plot = useAvailableChartHeight();
  const observations = useMemo(
    () =>
      Array.from({ length: 6 }, (_, batch) => {
        const values = Array.from(
          { length: 41 },
          (_, index) =>
            ([46, 54, 49, 61, 57, 65][batch] ?? 50) +
            factoryNoise(index, batch + 53) * (3 + (batch % 3)),
        );
        if (outliers) values.push(12 + batch, 88 + batch);
        return values;
      }),
    [outliers],
  );
  const boxes = useMemo(() => observations.map((values) => summarizeBox(values)), [observations]);
  const labels = Array.from({ length: 6 }, (_, index) =>
    t('라인 {{number}}', { number: index + 1 }),
  );
  const data: BoxPlotData = {
    labels,
    datasets: [
      {
        id: 'measurements',
        label: t('측정 분포'),
        backgroundColor: palette.colors.map((color) => alpha(color, 0.25)),
        borderColor: palette.colors,
        whiskerColor: palette.colors,
        outlierColor: palette.colors,
        data: observations.map((values, index) => ({
          id: `line-${index + 1}`,
          label: labels[index],
          kind: 'observations',
          values,
        })),
      },
    ],
  };
  const options: OwpBoxPlotChartProps['options'] = {
    ...chartMotion,
    plugins: {
      tooltip: {
        callbacks: createBoxPlotTooltipCallbacks({
          min: 'Min',
          q1: 'Q1',
          median: 'Median',
          q3: 'Q3',
          max: 'Max',
          whiskers: 'Whiskers',
          outliers: 'Outliers',
        }),
      },
    },
    onClick: (_event, items) =>
      props.onRecord?.(
        'click',
        items.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
      ),
  };
  useEffect(
    () =>
      onData?.({
        labels: Array.from({ length: 6 }, (_, index) =>
          t('라인 {{number}}', { number: index + 1 }),
        ),
        series: [
          { label: t('최솟값'), values: boxes.map((box) => box?.min ?? null) },
          { label: 'Q1', values: boxes.map((box) => box?.q1 ?? null) },
          {
            label: t('중앙값'),
            values: boxes.map((box) => box?.median ?? null),
          },
          { label: 'Q3', values: boxes.map((box) => box?.q3 ?? null) },
          { label: t('최댓값'), values: boxes.map((box) => box?.max ?? null) },
          {
            label: t('수염 하한'),
            values: boxes.map((box) => box?.low ?? null),
          },
          {
            label: t('수염 상한'),
            values: boxes.map((box) => box?.high ?? null),
          },
          {
            label: t('이상치 수'),
            values: boxes.map((box) => box?.outliers.length ?? null),
          },
        ],
      }),
    [boxes, onData, t],
  );
  return (
    <>
      <Controls>
        <Toggle label="이상치 포함" value={outliers} onChange={setOutliers} />
      </Controls>
      <div ref={plot} className="chart-canvas chart-native">
        <OwpBoxPlotChart
          data={data}
          options={options}
          height="100%"
          showExportButton={false}
          aria-label={t('차트입니다. 데이터 탭에서 값을 확인할 수 있습니다.')}
        />
      </div>
      <p className="chart-note">
        {t(
          '상자는 Q1–Q3, 가운데 선은 중앙값입니다. 수염은 1.5 IQR 안의 관측값까지 표시하고 범위 밖의 값은 점으로 표시합니다.',
        )}
      </p>
    </>
  );
}
