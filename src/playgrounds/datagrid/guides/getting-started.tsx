import { useMemo, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridProps, OwpDataGridReadOnlyProps } from '@owp/datagrid/types';

type ApiRow = {
  readonly 'OWP_DATA.DATA1': string;
  readonly 'OWP_DATA.DATA2': string;
};

// DATA1, DATA2는 점을 포함한 하나의 필드명입니다.
const apiRows: readonly ApiRow[] = [
  { 'OWP_DATA.DATA1': '1', 'OWP_DATA.DATA2': '설비 일상 점검' },
  { 'OWP_DATA.DATA1': '2', 'OWP_DATA.DATA2': '센서 교정' },
  { 'OWP_DATA.DATA1': '2', 'OWP_DATA.DATA2': '생산 품질 검사' },
  { 'OWP_DATA.DATA1': '2', 'OWP_DATA.DATA2': '센서 교정' },
];

const getRowId: OwpDataGridProps<ApiRow>['getRowId'] = (row) => row['OWP_DATA.DATA1'];

export function GettingStartedGrid() {
  const { t } = useOwpTranslation();
  const gridApi = useDataGridApi<ApiRow>();
  const [rows, setRows] = useState(apiRows);
  const [autoSelectionCount, setAutoSelectionCount] = useState(0);
  const [preservedSelectionCount, setPreservedSelectionCount] = useState(0);

  const columns = useMemo<OwpDataGridReadOnlyProps<ApiRow>['columns']>(
    () => [
      { id: 'source-id', field: 'OWP_DATA.DATA1', header: t('원본 ID'), minWidth: 100 },
      {
        id: 'task',
        field: 'OWP_DATA.DATA2',
        header: t('작업'),
        relWidth: 1,
        minWidth: 180,
        renderCell: ({ row }) => t(row['OWP_DATA.DATA2']),
      },
    ],
    [t],
  );

  const readOnlyProps: OwpDataGridReadOnlyProps<ApiRow> = {
    rows,
    columns,
    layout: { filterRow: true },
    rowSelectionMode: 'multiple',
    height: 250,
    radius: 0.6,
  };

  return (
    <Stack spacing={2}>
      <Button sx={{ alignSelf: 'flex-start' }} variant="outlined" onClick={() => setRows([...apiRows])}>
        {t('같은 데이터로 재조회')}
      </Button>
      <Stack spacing={1}>
        <Typography component="h3" variant="subtitle2">
          {t('자동 행 ID')}
        </Typography>
        <Typography variant="body2" role="status">
          {t('선택: {{count}}개 행', { count: autoSelectionCount })}
        </Typography>
        <OwpDataGrid
          {...readOnlyProps}
          api={gridApi}
          aria-label={t('자동 행 ID')}
          onRowSelectionModelChange={(ids) => setAutoSelectionCount(ids.length)}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography component="h3" variant="subtitle2">getRowId · strict</Typography>
        <OwpDataGrid {...readOnlyProps} getRowId={getRowId} aria-label="getRowId · strict" />
      </Stack>
      <Stack spacing={1}>
        <Typography component="h3" variant="subtitle2">getRowId · preserve</Typography>
        <Typography variant="body2" role="status">
          {t('선택: {{count}}개 행', { count: preservedSelectionCount })}
        </Typography>
        <OwpDataGrid
          {...readOnlyProps}
          getRowId={getRowId}
          duplicateRowIdPolicy="preserve"
          aria-label="getRowId · preserve"
          onRowSelectionModelChange={(ids) => setPreservedSelectionCount(ids.length)}
        />
      </Stack>
    </Stack>
  );
}
