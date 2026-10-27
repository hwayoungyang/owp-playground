import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import {
  DATA_GRID_FONT_FAMILY_STACK,
  defaultStyledTableTheme,
  getDefaultTableBorderColor,
  resolveOwpTableTheme,
  useGridTheme,
  useTableTheme,
} from '@owp/theme';

type ResultTableState = {
  readonly kind: 'idle' | 'loading' | 'error';
  readonly message: string;
};

/** Components 3.1.2에 없는 빈 본문은 공개 MUI Table로 구성하고 데이터 표는 OwpTable을 사용합니다. */
export function CoreResultTable({
  headers,
  rows,
  state,
  variant = 'mui',
}: {
  readonly headers: Readonly<Record<string, string>>;
  readonly rows: Record<string, ReactNode>[];
  readonly state?: ResultTableState;
  readonly variant?: 'mui' | 'dataGrid';
}) {
  const { t } = useOwpTranslation();
  const muiTheme = useTheme();
  const tableTheme = resolveOwpTableTheme(useTableTheme(), {
    ...defaultStyledTableTheme,
    borderColor: getDefaultTableBorderColor(muiTheme.palette.mode),
  });
  const gridTheme = useGridTheme('dataGrid');
  const isGrid = variant === 'dataGrid';
  if (!state && rows.length > 0)
    return (
      <OwpTable
        aria-label={t('조회 결과')}
        headers={headers}
        rows={rows}
        variant={variant}
        size="small"
        sx={{ width: '100%' }}
      />
    );

  const header = isGrid ? gridTheme.header : tableTheme.header;
  const borderColor = isGrid ? gridTheme.cell.borderColor : tableTheme.borderColor;
  const headerBorder = isGrid ? gridTheme.header.borderColor : tableTheme.header.borderColor;
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        overflowX: 'auto',
        borderColor,
        border: isGrid ? 0 : undefined,
        borderRadius: isGrid ? 0 : '0.8rem',
      }}
    >
      <Table
        size="small"
        aria-label={t('조회 결과')}
        aria-busy={state?.kind === 'loading'}
        sx={isGrid ? { borderCollapse: 'separate', borderSpacing: 0 } : undefined}
      >
        <TableHead>
          <TableRow>
            {Object.entries(headers).map(([key, label], index, columns) => (
              <TableCell
                key={key}
                align="center"
                sx={{
                  backgroundColor: header.backgroundColor,
                  color: header.color,
                  fontSize: header.fontSize,
                  fontWeight: header.fontWeight,
                  fontFamily: isGrid ? DATA_GRID_FONT_FAMILY_STACK : undefined,
                  lineHeight: isGrid ? '16px' : undefined,
                  height: isGrid ? gridTheme.header.height : undefined,
                  padding: isGrid ? '7px 2px 6px 10px' : '7px 10px',
                  borderTop: isGrid ? `1px solid ${headerBorder}` : undefined,
                  borderLeft: isGrid && index === 0 ? `1px solid ${headerBorder}` : 0,
                  borderBottom: `1px solid ${isGrid ? headerBorder : borderColor}`,
                  borderRight:
                    isGrid || index < columns.length - 1 ? `1px solid ${headerBorder}` : 0,
                }}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={Object.keys(headers).length}
              align="center"
              sx={{
                height: 160,
                padding: 2,
                borderBottom: isGrid ? `1px solid ${borderColor}` : 0,
                borderLeft: isGrid ? `1px solid ${borderColor}` : 0,
                borderRight: isGrid ? `1px solid ${borderColor}` : 0,
                backgroundColor: isGrid
                  ? gridTheme.row.backgroundColor
                  : tableTheme.cell.backgroundColor,
                color: isGrid ? gridTheme.body.color : 'text.secondary',
                fontSize: isGrid ? gridTheme.cell.fontSize : tableTheme.cell.fontSize,
                fontFamily: isGrid ? DATA_GRID_FONT_FAMILY_STACK : undefined,
                lineHeight: isGrid ? '16px' : undefined,
              }}
            >
              <Box role={state?.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
                {state?.message ?? t('조회 결과가 없습니다.')}
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
