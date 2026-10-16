import { CoreChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { memo, useEffect, useMemo, useState } from 'react';
import { createProcessSeries } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, UpdateButton } from '../runtime/Controls';

type SparkRow = {
  readonly id: number;
  readonly name: string;
  readonly value: number;
  readonly values: readonly number[];
};
const Sparkline = memo(function Sparkline({ values }: { readonly values: readonly number[] }) {
  const palette = useChartPalette();
  const { t } = useOwpTranslation();
  const rising = (values.at(-1) ?? 0) >= (values[0] ?? 0);
  return (
    <div
      className="chart-sparkline"
      role="img"
      aria-label={t('추세 {{direction}} · 현재 {{value}}', {
        direction: t(rising ? '상승' : '하락'),
        value: values.at(-1) ?? 0,
      })}
    >
      <CoreChart
        aria-hidden="true"
        type="line"
        data={{
          labels: values.map((_, index) => index + 1),
          datasets: [
            {
              data: [...values],
              borderColor: rising ? palette.success : palette.danger,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.35,
            },
          ],
        }}
        options={{
          animation: false,
          events: [],
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        }}
        height="100%"
      />
    </div>
  );
});

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [version, setVersion] = useState(0);
  const records = useMonthlyRecords();
  const rows = useMemo(
    () =>
      records.slice(0, 6).map((record, index) => {
        const current = Number(record.actual) + version * 3;
        const values = createProcessSeries({
          anchors: [current * 0.82, current * (index % 2 === 0 ? 1.06 : 0.73), current],
          count: 5,
          seed: 150 + index,
          volatility: 9,
        }).map(Math.round);
        return {
          id: index,
          name: t('라인 {{number}}', { number: index + 1 }),
          value: values.at(-1) ?? 0,
          values,
        };
      }),
    [records, version, t],
  );
  useEffect(() => {
    props.onData?.({
      labels: ['1', '2', '3', '4', '5'],
      series: rows.map((row) => ({ label: row.name, values: row.values })),
    });
  }, [rows, props.onData]);
  const columns: OwpDataGridColumn<SparkRow>[] = [
    { id: 'name', field: 'name', header: t('라인'), minWidth: 100, relWidth: 1 },
    { id: 'value', field: 'value', header: t('생산량'), type: 'number', minWidth: 80, relWidth: 1 },
    {
      id: 'trend',
      header: t('추세'),
      minWidth: 130,
      relWidth: 2,
      renderCell: ({ row }) => <Sparkline values={row.values} />,
    },
  ];
  return (
    <>
      <Controls>
        <UpdateButton
          onClick={() => {
            setVersion((value) => value + 1);
            props.onRecord?.('data', 'sparkline');
          }}
        />
      </Controls>
      <OwpDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        visibleRowCount={rows.length}
        rowSelectionMode="none"
      />
    </>
  );
}
