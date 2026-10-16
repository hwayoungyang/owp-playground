import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { useEffect } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';

type DetailRow = { readonly id: number; readonly name: string; readonly value: number };
export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const records = useMonthlyRecords();
  const rows = records.slice(0, 4).map((record, index) => ({
    id: index,
    name: t('라인 {{number}}', { number: index + 1 }),
    value: Number(record.actual),
  }));
  const chart = useCartesian({}, { onRecord: props.onRecord });
  useEffect(() => {
    props.onData?.({
      labels: [t('월'), t('화'), t('수'), t('목'), t('금'), t('토')],
      series: records.slice(0, 4).map((record, index) => ({
        label: t('라인 {{number}}', { number: index + 1 }),
        values: [
          record.actual - 20,
          record.actual - 8,
          record.actual + 5,
          record.actual - 4,
          record.actual + 10,
          record.actual,
        ],
      })),
    });
  }, [records, props.onData, t]);
  const columns: OwpDataGridColumn<DetailRow>[] = [
    { id: 'name', field: 'name', header: t('라인'), minWidth: 140, relWidth: 1 },
    {
      id: 'value',
      field: 'value',
      header: t('생산량'),
      type: 'number',
      minWidth: 100,
      relWidth: 1,
    },
  ];
  return (
    <OwpDataGrid
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      visibleRowCount={rows.length}
      detailPanel={{
        height: 280,
        renderDetail: ({ row }) => (
          <div className="chart-detail">
            <ChartFrame
              {...chart}
              data={{
                ...chart.data,
                labels: [t('월'), t('화'), t('수'), t('목'), t('금'), t('토')],
                datasets: chart.data.datasets.map((series) => ({
                  ...series,
                  label: row.name,
                  data: [
                    row.value - 20,
                    row.value - 8,
                    row.value + 5,
                    row.value - 4,
                    row.value + 10,
                    row.value,
                  ],
                })),
              }}
              type="bar"
              height={240}
              showExportButton
            />
          </div>
        ),
      }}
    />
  );
}
