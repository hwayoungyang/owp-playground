import type { OwpDataGridColumn } from '@owp/datagrid/types';
import i18next, { type TFunction } from 'i18next';
import type { Task } from './data';
import type { GridConfiguration } from './gridTypes';

function translateColumns(
  columns: readonly OwpDataGridColumn<Task>[],
  t: TFunction,
  language: string,
) {
  return columns.map((column) => ({
    ...column,
    header: typeof column.header === 'string' ? t(column.header) : column.header,
    ...(column.id === 'status' && language === 'en' ? { minWidth: 132 } : {}),
    valueOptions: column.valueOptions?.map((option) => ({
      ...option,
      label: typeof option.label === 'string' ? t(option.label) : option.label,
    })),
  }));
}

function translateSummary(
  rows: GridConfiguration['summaryRows'],
  t: TFunction,
): GridConfiguration['summaryRows'] {
  return rows?.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => ({
      ...cell,
      value: typeof cell.value === 'string' ? t(cell.value) : cell.value,
    })),
  }));
}

export function translateGridConfiguration(
  configuration: GridConfiguration,
  language: string,
): GridConfiguration {
  const t = i18next.getFixedT(language, 'app');
  const detail = configuration.detailPanel;
  return {
    ...configuration,
    columns: translateColumns(configuration.columns, t, language),
    headerRows: configuration.headerRows?.map((row) =>
      row.map((cell) => ({
        ...cell,
        header: typeof cell.header === 'string' ? t(cell.header) : cell.header,
      })),
    ),
    summaryRows: translateSummary(configuration.summaryRows, t),
    noDataMessage:
      typeof configuration.noDataMessage === 'string'
        ? t(configuration.noDataMessage)
        : configuration.noDataMessage,
    pinnedBottomRows: configuration.pinnedBottomRows?.map((row) => ({
      ...row,
      project: t(row.project),
      task: t(row.task),
    })),
    detailPanel: detail?.gridProps
      ? {
          ...detail,
          gridProps: {
            ...detail.gridProps,
            columns: translateColumns(detail.gridProps.columns, t, language),
            summaryRows: translateSummary(detail.gridProps.summaryRows, t),
          },
        }
      : detail,
  };
}
