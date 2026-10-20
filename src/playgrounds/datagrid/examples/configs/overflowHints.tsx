import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { getRowId, initialTasks, owners, statuses } from '../../model/data';
import type { Task } from '../../types';

export const overflowHintsBaseColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1 },
  { id: 'task', field: 'task', header: '작업', minWidth: 180, relWidth: 1.2 },
  { id: 'note', field: 'note', header: '검토 내용', minWidth: 180, relWidth: 1.2 },
  { id: 'mixed', field: 'mixed', header: '인수인계 사항', minWidth: 160, relWidth: 1 },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자와 담당 업무',
    minWidth: 140,
    relWidth: 0.9,
    type: 'select',
    valueOptions: owners.map((value) => ({
      value,
      label: `${value} · 웹 서비스 화면 설계 및 접근성 검토 담당`,
    })),
  },
  {
    id: 'status',
    field: 'status',
    header: '상태와 후속 조치',
    minWidth: 140,
    relWidth: 0.9,
    type: 'select',
    valueOptions: statuses.map((value) => ({
      value,
      label: `${value} · 검토 의견과 배포 일정을 확인한 뒤 다음 단계로 진행`,
    })),
  },
  {
    id: 'tags',
    field: 'tags',
    header: '관련 업무',
    minWidth: 160,
    relWidth: 1,
    type: 'select',
    selectOptions: { multiple: true },
    valueOptions: [
      { value: 'design', label: '디자인 · 사용자 흐름과 반응형 화면 구성 검토' },
      { value: 'web', label: '웹 · 브라우저 호환성과 키보드 접근성 검증' },
      { value: 'mobile', label: '모바일 · 작은 화면의 입력과 스크롤 동작 확인' },
    ],
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '전체 계획 건수',
    minWidth: 110,
    relWidth: 0.7,
    type: 'number',
    numberOptions: { maximumFractionDigits: 0 },
  },
  {
    id: 'completed',
    field: 'completed',
    header: '누적 완료 건수',
    minWidth: 110,
    relWidth: 0.7,
    type: 'number',
    numberOptions: { maximumFractionDigits: 0 },
  },
  {
    id: 'cost',
    field: 'cost',
    header: '총 예상 비용 (원)',
    minWidth: 120,
    relWidth: 0.8,
    type: 'number',
    numberOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
] satisfies OwpDataGridColumn<Task>[];

export const overflowHintsColumns = overflowHintsBaseColumns.map((column) => ({
  ...column,
  editable: column.id !== 'project',
  resizable: true,
}));

export const overflowHintsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.map((row, index) => ({
    ...row,
    task: `${row.task} · 사용자 흐름과 화면 구성, 데이터 입력 조건을 함께 검토합니다.`,
    note: '입력값 검증, 오류 안내, 키보드 이동과 작은 화면의 스크롤 동작을 확인하고 검토 의견을 기록합니다.',
    mixed:
      '최종 검토 의견과 변경 이력을 다음 담당자에게 전달하고, 배포 일정과 후속 확인 항목을 함께 공유합니다.',
    quantity: 9876543210 + index * 23456,
    completed: 1234567890 + index * 12345,
    cost: 1234567890123.45 + index * 9876543.21,
  })),
  columns: overflowHintsColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'none',
  overflowHint: { header: true, cell: true },
};
