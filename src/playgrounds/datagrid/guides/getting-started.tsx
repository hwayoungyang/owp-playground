import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';

type Row = { id: number; task: string };

const columns: OwpDataGridColumn<Row>[] = [
  { id: 'task', field: 'task', header: '작업', relWidth: 1, minWidth: 180 },
];
const rows: Row[] = [
  { id: 1, task: '분석 및 기획' },
  { id: 2, task: '개발' },
  { id: 3, task: '배포' },
];

export function GettingStartedExample() {
  return <OwpDataGrid columns={columns} rows={rows} getRowId={(row) => row.id} radius={0.6} />;
}
