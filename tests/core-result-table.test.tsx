import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider, createTheme } from '@mui/material';
import { OwpThemeProvider } from '@owp/theme';
import { describe, expect, it } from 'vitest';
import '../src/app/i18n';
import { CoreResultTable } from '../src/playgrounds/core/runtime/CoreResultTable';

const headers = { id: 'ID', name: '항목명' };

describe('Core result table body states', () => {
  it.each([
    ['idle', '조회 버튼을 눌러 주세요.'],
    ['loading', '조회 중'],
    ['error', '조회에 실패했습니다. 다시 시도해 주세요.'],
  ] as const)('renders %s inside a real full-width table body', (kind, message) => {
    const html = renderToStaticMarkup(
      <CoreResultTable headers={headers} rows={[]} state={{ kind, message }} />,
    );
    const body = html.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
    expect(body).toContain(message);
    expect(body).toContain('colSpan="2"');
    expect(body).toContain(kind === 'error' ? 'role="alert"' : 'role="status"');
    expect(html).toContain('width:100%');
    expect(html).toContain('height:160px');
    expect(html).toContain(`aria-busy="${kind === 'loading'}"`);
  });

  it('centers successful zero-row results in the body', () => {
    const html = renderToStaticMarkup(<CoreResultTable headers={headers} rows={[]} />);
    expect(html).toMatch(/<tbody\b[\s\S]*조회 결과가 없습니다\.[\s\S]*<\/tbody>/);
    expect(html).toContain('MuiTableCell-alignCenter');
    expect(html).not.toContain('조회 버튼을 눌러 주세요.');
  });

  it('uses OwpTable for real rows and hides stale rows while a request is active', () => {
    const rows = [{ id: 'item-1', name: '항목 1' }];
    const ready = renderToStaticMarkup(<CoreResultTable headers={headers} rows={rows} />);
    const loading = renderToStaticMarkup(
      <CoreResultTable
        headers={headers}
        rows={rows}
        state={{ kind: 'loading', message: '조회 중' }}
      />,
    );
    expect(ready).toContain('owp-table-cell-content');
    expect(ready).toContain('item-1');
    expect(ready).not.toContain('colSpan="2"');
    expect(loading).toContain('조회 중');
    expect(loading).not.toContain('item-1');
  });

  it.each(['light', 'dark'] as const)('uses the public table theme in %s mode', (mode) => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={createTheme({ palette: { mode } })}>
        <OwpThemeProvider
          table={{
            borderColor: '#123456',
            header: { backgroundColor: '#234567', color: '#ffffff' },
            cell: { backgroundColor: '#345678' },
          }}
        >
          <CoreResultTable headers={headers} rows={[]} />
        </OwpThemeProvider>
      </ThemeProvider>,
    );
    expect(html).toContain('#123456');
    expect(html).toContain('background-color:#234567');
    expect(html).toContain('background-color:#345678');
  });

  it('uses the same public DataGrid header and body colors for empty and populated rows', () => {
    function render(rows: { id: string; name: string }[]) {
      return renderToStaticMarkup(
        <OwpThemeProvider
          dataGrid={{
            header: { backgroundColor: '#123456', borderColor: '#234567' },
            cell: { borderColor: '#345678' },
            row: { backgroundColor: '#456789' },
          }}
        >
          <CoreResultTable headers={headers} rows={rows} variant="dataGrid" />
        </OwpThemeProvider>,
      );
    }
    for (const html of [render([]), render([{ id: 'item-1', name: '항목 1' }])]) {
      expect(html).toContain('background-color:#123456');
      expect(html).toContain('1px solid #234567');
      expect(html).toContain('1px solid #345678');
      expect(html).toContain('background-color:#456789');
    }
  });
});
