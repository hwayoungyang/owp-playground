import type { OwpDataGridProps } from '@owp/datagrid/types';
import { translate } from '../../../../shared/i18n/translate';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export const taskValidationConfiguration = {
  rows: initialTasks,
  columns: editableTaskColumns.map((column) => ({
    ...column,
    required: column.id === 'task',
    ...(column.id === 'completed'
      ? {
          numberOptions: { min: 0, allowNegative: false },
          validate: ({ row, value }) =>
            Number(value) > row.quantity
              ? translate('완료 수량은 계획 수량을 넘을 수 없습니다.')
              : null,
        }
      : {}),
  })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
} satisfies OwpDataGridProps<Task, Task>;
