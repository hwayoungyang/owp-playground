import { OwpRadialChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ApiRow } from '../../../features/code/api-data';
import { chartFromApi } from '../model/apiData';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { useChartPalette } from '../model/useCartesian';

/** DATA1은 공정명, DATA2는 처리 수량을 담은 API 숫자 문자열입니다. */
const apiResponse: readonly ApiRow[] = [
  { 'OWP_DATA.DATA1': '절단', 'OWP_DATA.DATA2': '1523' },
  { 'OWP_DATA.DATA1': '선삭', 'OWP_DATA.DATA2': '916' },
  { 'OWP_DATA.DATA1': '밀링', 'OWP_DATA.DATA2': '610' },
  { 'OWP_DATA.DATA1': '용접', 'OWP_DATA.DATA2': '503' },
  { 'OWP_DATA.DATA1': '조립', 'OWP_DATA.DATA2': '425' },
  { 'OWP_DATA.DATA1': '검사', 'OWP_DATA.DATA2': '301' },
  { 'OWP_DATA.DATA1': '포장', 'OWP_DATA.DATA2': '182' },
];
const snapshot = chartFromApi(apiResponse, ['처리 수량']);

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const values = snapshot.series[0]?.values ?? [];
  const labels = snapshot.labels.map((label) => t(label));
  const rings = [
    {
      id: 'processed',
      label: t('처리 수량'),
      items: labels.map((label, index) => ({
        id: snapshot.labels[index] ?? String(index),
        label,
        value: values[index] ?? null,
        color: palette.colors[index],
      })),
      datasetOptions: {
        borderColor: palette.surface,
        borderWidth: 1,
        borderRadius: 3,
        spacing: 0,
      },
    },
  ];
  const chart = useAreaRadialExample(
    {
      labels,
      series: rings.map((ring) => ({
        label: ring.label,
        values: ring.items.map((item) => item.value),
      })),
    },
    props,
    'semi-circle',
  );
  return (
    <div ref={chart.plot} className={chart.className}>
      <OwpRadialChart
        rings={rings}
        semiCircle
        cutout="65%"
        outsideLabels
        options={chart.options}
        {...chart.frame}
      />
    </div>
  );
}
