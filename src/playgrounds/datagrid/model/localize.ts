import type { OwpDataGridColumn } from '@owp/datagrid/types';
import i18next, { type TFunction } from 'i18next';
import type { Task } from './data';
import type { Definition } from './types';

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
  rows: Definition['summaryRows'],
  t: TFunction,
): Definition['summaryRows'] {
  return rows?.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => ({
      ...cell,
      value: typeof cell.value === 'string' ? t(cell.value) : cell.value,
    })),
  }));
}

export function translateDefinition(definition: Definition, language: string): Definition {
  const t = i18next.getFixedT(language, 'app');
  const detail = definition.detailPanel;
  return {
    ...definition,
    columns: translateColumns(definition.columns, t, language),
    headerRows: definition.headerRows?.map((row) =>
      row.map((cell) => ({
        ...cell,
        header: typeof cell.header === 'string' ? t(cell.header) : cell.header,
      })),
    ),
    summaryRows: translateSummary(definition.summaryRows, t),
    noDataMessage:
      typeof definition.noDataMessage === 'string'
        ? t(definition.noDataMessage)
        : definition.noDataMessage,
    pinnedBottomRows: definition.pinnedBottomRows?.map((row) => ({
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
