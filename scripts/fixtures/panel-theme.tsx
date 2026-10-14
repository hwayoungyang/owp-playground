import { createTheme, ThemeProvider } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { OwpThemeProvider } from '@owp/theme';
import type { OwpGridThemeConfigType } from '@owp/theme/types';
import { createRoot } from 'react-dom/client';
import { createGridTheme } from '../../src/shared/theme/themes';
import { colors } from '../../src/shared/theme/tokens';

type Row = { id: number; task: string };
const columns: OwpDataGridColumn<Row>[] = [
  { id: 'task', field: 'task', header: '작업', relWidth: 1, minWidth: 150 },
];
const rows: Row[] = [
  { id: 1, task: '분석 및 기획' },
  { id: 2, task: '개발' },
  { id: 3, task: '배포' },
];
const cases: readonly (readonly [string, OwpGridThemeConfigType])[] = [
  ['separate', {
    header: { backgroundColor: '#fafafa' },
    filter: { backgroundColor: '#ffffff' },
    panel: { backgroundColor: '#e5e5e5', inactiveFilterColor: '#666666' },
  }],
  ['playground', createGridTheme(colors.light)],
];
const root = document.getElementById('root');
if (root) createRoot(root).render(
  <ThemeProvider theme={createTheme()}>
    {cases.map(([id, theme]) => (
      <section key={id} data-case={id} style={{ width: 760, margin: '24px auto' }}>
        <h2>{id}</h2>
        <OwpThemeProvider dataGrid={theme}>
          <OwpDataGrid columns={columns} rows={rows} getRowId={(row) => row.id}
            height={230} rowSelectionMode="multiple" rowReordering={{ dragMode: 'single' }}
            layout={{ filterRow: true }} />
        </OwpThemeProvider>
      </section>
    ))}
  </ThemeProvider>,
);
