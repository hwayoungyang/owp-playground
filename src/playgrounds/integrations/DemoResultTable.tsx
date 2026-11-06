import { useOwpTranslation } from '@owp/components/hooks';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import type { ReactNode } from 'react';

type DemoResultRow = {
  readonly label: string;
  readonly api?: string;
  readonly display?: ReactNode;
  readonly value: ReactNode;
};

export function DemoResultTable({
  rows,
  label,
}: {
  readonly rows: readonly DemoResultRow[];
  readonly label: string;
}) {
  const { t } = useOwpTranslation();
  const showApi = rows.some((row) => row.api);
  const showDisplay = rows.some((row) => row.display !== undefined);
  return (
    <div
      className="integration-result-table"
      data-api={showApi || undefined}
      data-display={showDisplay || undefined}
    >
      <Table size="small" aria-label={label}>
        <TableHead>
          <TableRow>
            <TableCell>{t('항목')}</TableCell>
            {showApi && <TableCell>{t('컴포넌트 / API')}</TableCell>}
            {showDisplay && <TableCell>{t('표시 값')}</TableCell>}
            <TableCell>{t(showDisplay ? '반환값' : '현재 값')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell component="th" scope="row">
                {row.label}
              </TableCell>
              {showApi && (
                <TableCell>
                  <code>{row.api ?? '—'}</code>
                </TableCell>
              )}
              {showDisplay && <TableCell>{row.display ?? '—'}</TableCell>}
              <TableCell>{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
