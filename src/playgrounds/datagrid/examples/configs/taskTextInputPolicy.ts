import type {
  OwpDataGridColumn,
  OwpDataGridProps,
  OwpDataGridTextOptions,
} from '@owp/datagrid/types';
import { getRowId, seedTask } from '../../model/data';
import type { Task } from '../../types';

export const textFeedbackPresets = [
  { id: 'off', label: '안내 없음', options: { showRejectedInputFeedback: false } },
  {
    id: 'border',
    label: '테두리만',
    options: { showRejectedInputFeedback: true, showRejectedInputMessage: false },
  },
  { id: 'default', label: '기본 안내', options: { showRejectedInputFeedback: true } },
  { id: 'custom', label: '직접 입력한 문구', options: { showRejectedInputFeedback: true } },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly options: OwpDataGridTextOptions;
}[];

export type TextFeedbackPreset = (typeof textFeedbackPresets)[number];
export type TextPolicyValidation = Readonly<
  Pick<OwpDataGridColumn<Task>, 'required' | 'validationMode' | 'clearErrorOnInput'>
>;

const textPolicyColumns = [
  {
    id: 'task',
    field: 'task',
    header: '직접 설정한 정규식',
    type: 'text',
    editable: true,
    minWidth: 210,
    relWidth: 1,
    textOptions: { allowedPattern: /^[A-Za-z0-9]*$/ },
  },
  {
    id: 'owner',
    field: 'owner',
    header: '입력 안내·오류 비교',
    type: 'text',
    editable: true,
    minWidth: 210,
    relWidth: 1,
    textOptions: { allowedPattern: /^[YN]*$/, uppercase: true, maxLength: 1 },
  },
  {
    id: 'status',
    field: 'status',
    header: '영문·숫자 코드',
    type: 'text',
    editable: true,
    minWidth: 210,
    relWidth: 1,
    textOptions: {
      allowedPattern: /^[A-Z0-9]*$/,
      uppercase: true,
      showRejectedInputFeedback: true,
    },
  },
] satisfies OwpDataGridColumn<Task>[];

export function createTextInputPolicyColumns(
  columns: readonly OwpDataGridColumn<Task>[] = textPolicyColumns,
  feedback: TextFeedbackPreset = textFeedbackPresets[0],
  validation: TextPolicyValidation = {},
  message = '',
  allowedPattern: RegExp | null = /^[A-Za-z0-9]*$/,
): OwpDataGridColumn<Task>[] {
  return columns.map((column) => {
    if (column.id === 'task') {
      return { ...column, textOptions: allowedPattern === null ? {} : { allowedPattern } };
    }
    if (column.id !== 'owner') return column;
    const useCustomMessage = feedback.id !== 'default';
    return {
      ...column,
      ...validation,
      textOptions: {
        ...column.textOptions,
        ...feedback.options,
        ...(useCustomMessage ? { rejectedInputMessage: message } : {}),
      },
    };
  });
}

export const taskTextInputPolicyConfiguration = {
  rows: [
    { ...seedTask, id: 'task-1', task: 'Ab12', owner: 'Y', status: 'AB12' },
    { ...seedTask, id: 'task-2', task: 'ServerValue', owner: 'yes', status: '서버 값' },
    { ...seedTask, id: 'task-3', task: '', owner: '', status: '' },
  ],
  columns: textPolicyColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  visibleRowCount: 3,
  height: 'auto',
} satisfies OwpDataGridProps<Task, Task>;
