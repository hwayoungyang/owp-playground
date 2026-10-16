import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';

// 점을 포함한 하나의 필드명입니다. DATA1은 행 식별자, DATA2는 작업명입니다.
const apiRows = [
  { 'OWP_DATA.DATA1': '1', 'OWP_DATA.DATA2': '설비 일상 점검' },
  { 'OWP_DATA.DATA1': '2', 'OWP_DATA.DATA2': '센서 교정' },
  { 'OWP_DATA.DATA1': '3', 'OWP_DATA.DATA2': '생산 품질 검사' },
] as const;
type ApiRow = (typeof apiRows)[number];

const columns: OwpDataGridColumn<ApiRow>[] = [
  { id: 'task', field: 'OWP_DATA.DATA2', header: '작업', relWidth: 1, minWidth: 180 },
];

export function GettingStartedGrid() {
  return (
    <OwpDataGrid
      columns={columns}
      rows={apiRows}
      getRowId={(row) => row['OWP_DATA.DATA1']}
      radius={0.6}
    />
  );
}
