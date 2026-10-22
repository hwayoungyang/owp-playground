import type { useOwpTranslation } from '@owp/components/hooks';
import type { OwpDataGridColumn, OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export type TaskValidationOptions = Readonly<
  Pick<OwpDataGridColumn<Task>, 'validationMode' | 'clearErrorOnInput'>
>;

export function createTaskValidationColumns(
  t?: ReturnType<typeof useOwpTranslation>['t'],
  columns: readonly OwpDataGridColumn<Task>[] = editableTaskColumns,
  { validationMode = 'onCommit', clearErrorOnInput = false }: TaskValidationOptions = {},
): OwpDataGridColumn<Task>[] {
  return columns.map((column) => ({
    ...column,
    validationMode,
    clearErrorOnInput,
    required: column.id === 'task',
    ...(column.id === 'completed'
      ? {
          numberOptions: { min: 0, allowNegative: false },
          validate: ({
            row,
            value,
          }: Parameters<NonNullable<OwpDataGridColumn<Task>['validate']>>[0]) =>
            Number(value) > row.quantity
              ? (t?.('완료 수량은 계획 수량을 넘을 수 없습니다.') ??
                '완료 수량은 계획 수량을 넘을 수 없습니다.')
              : null,
        }
      : {}),
  }));
}

export const taskValidationConfiguration = {
  rows: initialTasks,
  columns: createTaskValidationColumns(),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
} satisfies OwpDataGridProps<Task, Task>;
