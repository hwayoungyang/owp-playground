import { alpha } from '@mui/material/styles';
import { OwpRadarChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ApiRow } from '../../../features/code/api-data';
import { chartFromApi } from '../model/apiData';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { useChartPalette } from '../model/useCartesian';

/** DATA1은 평가 지표, DATA2·DATA3은 같은 0–100 척도로 환산한 가상 API 점수입니다. */
const apiResponse: readonly ApiRow[] = [
  {
    'OWP_DATA.DATA1': '생산성',
    'OWP_DATA.DATA2': '91',
    'OWP_DATA.DATA3': '79',
  },
  { 'OWP_DATA.DATA1': '품질', 'OWP_DATA.DATA2': '96', 'OWP_DATA.DATA3': '89' },
  {
    'OWP_DATA.DATA1': '가동 안정성',
    'OWP_DATA.DATA2': '72',
    'OWP_DATA.DATA3': '93',
  },
  {
    'OWP_DATA.DATA1': '납기 준수',
    'OWP_DATA.DATA2': '86',
    'OWP_DATA.DATA3': '76',
  },
  {
    'OWP_DATA.DATA1': '에너지 효율',
    'OWP_DATA.DATA2': '64',
    'OWP_DATA.DATA3': '88',
  },
  {
    'OWP_DATA.DATA1': '예방 정비',
    'OWP_DATA.DATA2': '78',
    'OWP_DATA.DATA3': '66',
  },
];
const snapshot = chartFromApi(apiResponse, ['라인 A', '라인 B']);

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const labels = snapshot.labels.map((label) => t(label));
  const series = snapshot.series.map((series, index) => ({
    id: `line-${index}`,
    label: t(series.label),
    values: series.values,
    color: palette.colors[index],
    datasetOptions: {
      backgroundColor: alpha(palette.colors[index] ?? palette.ink, 0.12),
      borderDash: index === 0 ? [] : [5, 4],
      pointStyle: index === 0 ? ('circle' as const) : ('rect' as const),
      pointBorderColor: palette.surface,
      pointBorderWidth: 1.5,
    },
  }));
  const chart = useAreaRadialExample({ labels, series }, props, 'radar');
  return (
    <>
      <div ref={chart.plot} className={chart.className}>
        <OwpRadarChart
          labels={labels}
          series={series}
          min={0}
          max={100}
          stepSize={20}
          valueFormatter={(value) => t('{{value}}점', { value })}
          options={{
            ...chart.options,
            layout: { padding: 4 },
            plugins: {
              tooltip: {
                callbacks: {
                  labelColor: ({ datasetIndex }) => {
                    const color = palette.colors[datasetIndex] ?? palette.ink;
                    return { backgroundColor: color, borderColor: color, borderWidth: 0 };
                  },
                  labelPointStyle: ({ datasetIndex }) => ({
                    pointStyle: datasetIndex === 0 ? 'circle' : 'rect',
                    rotation: 0,
                  }),
                },
              },
            },
          }}
          {...chart.frame}
        />
      </div>
      <p className="chart-note">
        {t('각 지표는 0–100점의 가상 점수입니다. 점수가 높을수록 우수합니다.')}
      </p>
    </>
  );
}
