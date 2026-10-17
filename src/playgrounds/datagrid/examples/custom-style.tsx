import { Button, MenuItem, Select, Slider } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridHeaderRow } from '@owp/datagrid/types';
import { OwpThemeProvider, useGridTheme } from '@owp/theme';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { getRowId, initialTasks, owners, type Task } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';

const headerDepthSchema = z.coerce.number().pipe(z.union([z.literal(2), z.literal(3)]));

const columns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1 },
  {
    id: 'task',
    field: 'task',
    header: '작업',
    minWidth: 220,
    relWidth: 1.8,
    editable: true,
    cellStyle: { fontStyle: 'italic' },
  },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자',
    minWidth: 150,
    relWidth: 1,
    type: 'select',
    editable: true,
    autocompleteOptions: {},
    valueOptions: owners.map((value) => ({ value, label: value })),
  },
  { id: 'note', field: 'note', header: '메모', minWidth: 220, relWidth: 1.8, editable: true },
] satisfies OwpDataGridColumn<Task>[];

const groupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner'], align: 'center' },
    { columnId: 'note', rowSpan: 2 },
  ],
  [{ columnId: 'task' }, { columnId: 'owner' }],
];

const baseSx = {
  '& .OwpDataGrid-root': { boxShadow: { xs: 1, md: 2 } },
  '& .OwpDataGrid-headerCell': { fontWeight: 700 },
  '& .OwpDataGrid-cell:not([data-owp-data-grid-editing="true"])': {
    px: { xs: 0.5, md: 1.5 },
    '& .OwpDataGrid-cellContent': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      letterSpacing: '0.02em',
    },
  },
} satisfies SxProps<Theme>;

const stateSx = (theme: Theme) => ({
  '& .OwpDataGrid-cell': { fontFamily: theme.typography.fontFamily },
  '& .OwpDataGrid-cell:not([data-owp-data-grid-editing="true"]):hover .OwpDataGrid-cellContent': {
    color: 'var(--pg-blue)',
  },
  '& .OwpDataGrid-cell:focus-within .OwpDataGrid-cellContent': { fontWeight: 600 },
});

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks.map((row, index) => ({
    ...row,
    note:
      index === 0
        ? '프로젝트 검토에서 정리한 요구사항과 후속 작업을 확인하고 다음 단계의 일정에 함께 반영합니다.'
        : row.note,
  })),
  columns,
  headerRows: groupedHeaders,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};

export function StyledHeadersGrid(props: GridViewProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const { t } = useTranslation('app');
  const [preset, setPreset] = useState<'default' | 'striped' | 'emphasis'>('striped');
  const [fontSize, setFontSize] = useState(14);
  const [headerDepth, setHeaderDepth] = useState<2 | 3>(2);
  const styled = preset !== 'default';
  const inheritedTheme = useGridTheme('dataGrid');
  const headerRows = useMemo<readonly OwpDataGridHeaderRow[]>(() => {
    const details: OwpDataGridHeaderRow = [
      {
        id: 'work',
        header: (
          <span className="custom-style-group-title" data-tier="sub">
            {t('작업 정보')}
          </span>
        ),
        excelLabel: t('작업 정보'),
        columnIds: ['task', 'owner'],
        align: 'center',
      },
      { columnId: 'note', rowSpan: 2 },
    ];
    const leaves: OwpDataGridHeaderRow = [{ columnId: 'task' }, { columnId: 'owner' }];
    if (headerDepth === 2) return [[{ columnId: 'project', rowSpan: 2 }, ...details], leaves];
    return [
      [
        { columnId: 'project', rowSpan: 3 },
        {
          id: 'overview',
          header: (
            <span className="custom-style-group-title" data-tier="main">
              {t('업무 정보')}
            </span>
          ),
          excelLabel: t('업무 정보'),
          columnIds: ['task', 'owner', 'note'],
          align: 'center',
        },
      ],
      details,
      leaves,
    ];
  }, [headerDepth, t]);
  const dataGrid = useMemo(
    () => ({
      ...inheritedTheme,
      header: {
        ...inheritedTheme.header,
        height: styled ? fontSize + 30 : inheritedTheme.header.height,
      },
    }),
    [inheritedTheme, styled, fontSize],
  );
  const completedRowsSx: Record<string, { bgcolor: string; fontWeight: number }> =
    Object.fromEntries(
      (gridProps.rows ?? gridConfiguration.rows)
        .filter((row) => row.status === '완료')
        .map((row) => [
          `& .OwpDataGrid-row[data-owp-data-grid-row-key="string:${row.id}"] .OwpDataGrid-cell`,
          { bgcolor: 'var(--pg-success-wash)', fontWeight: 600 },
        ]),
    );
  const sx: SxProps<Theme> = [
    styled && baseSx,
    styled && stateSx,
    styled && {
      '& .OwpDataGrid-cell, & .OwpDataGrid-headerCell': { fontSize },
    },
    preset === 'striped' && {
      '& .OwpDataGrid-headerCell': { bgcolor: 'var(--pg-blue-wash)' },
      '& .OwpDataGrid-headerLabel': { color: 'var(--pg-blue)' },
      '& .OwpDataGrid-row:nth-of-type(even) .OwpDataGrid-cell': {
        bgcolor: 'var(--pg-blue-wash)',
      },
    },
    preset === 'emphasis' && {
      '& .OwpDataGrid-headerCell': {
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      },
      '& .OwpDataGrid-headerLabel': { color: 'inherit' },
    },
    preset === 'emphasis' && completedRowsSx,
    styled && {
      '& .OwpDataGrid-headerCell:has(.custom-style-group-title[data-tier="main"])': {
        fontSize: fontSize + 2,
      },
    },
    styled && {
      '& .OwpDataGrid-row:hover .OwpDataGrid-cell': {
        bgcolor: 'var(--pg-purple-wash)',
      },
    },
  ];
  const currentColumns = (gridProps.columns ?? columns).map((column) => ({
    ...column,
    header: typeof column.header === 'string' ? t(column.header) : column.header,
    cellStyle: styled ? column.cellStyle : undefined,
  }));

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <fieldset className="example-controls" aria-label={t('스타일')}>
        {(['default', 'striped', 'emphasis'] as const).map((value) => (
          <Button
            key={value}
            variant={preset === value ? 'contained' : 'outlined'}
            aria-pressed={preset === value}
            onClick={() => setPreset(value)}
          >
            {t(value === 'default' ? '기본' : value === 'striped' ? '줄무늬' : '강조')}
          </Button>
        ))}
      </fieldset>
      <div className="example-controls">
        <label htmlFor="custom-header-depth">{t('헤더 단계')}</label>
        <Select
          id="custom-header-depth"
          value={headerDepth}
          inputProps={{ 'aria-label': t('헤더 단계') }}
          onChange={(event) => {
            const result = headerDepthSchema.safeParse(event.target.value);
            if (result.success) setHeaderDepth(result.data);
          }}
        >
          <MenuItem value={2}>{t('2단')}</MenuItem>
          <MenuItem value={3}>{t('3단')}</MenuItem>
        </Select>
        <div className="custom-style-size">
          <span>{t('글자 크기')}</span>
          <Slider
            size="small"
            min={12}
            max={18}
            step={1}
            value={fontSize}
            disabled={!styled}
            aria-label={t('글자 크기')}
            valueLabelDisplay="auto"
            onChange={(_, value) => {
              if (typeof value === 'number') setFontSize(value);
            }}
          />
          <span>{fontSize}px</span>
        </div>
      </div>
      <div className="example-grid">
        <OwpThemeProvider dataGrid={dataGrid}>
          <OwpDataGrid
            ref={gridRef}
            rows={gridConfiguration.rows}
            getRowId={getRowId}
            rowSelectionMode="none"
            {...gridProps}
            columns={currentColumns}
            headerRows={headerRows}
            className="custom-style-grid"
            height="100%"
            virtualization={
              styled
                ? {
                    ...(typeof gridProps.virtualization === 'object'
                      ? gridProps.virtualization
                      : {}),
                    rowHeight: fontSize + 26,
                  }
                : (gridProps.virtualization ?? { rowHeight: 40 })
            }
            sx={sx}
          />
        </OwpThemeProvider>
      </div>
    </div>
  );
}
