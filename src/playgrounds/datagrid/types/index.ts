import type {
  OwpDataGridProps,
  OwpDataGridRef,
  OwpDataGridRowSelectionMode,
} from '@owp/datagrid/types';
import type { RefObject } from 'react';

export type Task = {
  readonly id: string;
  readonly project: string;
  readonly task: string;
  readonly owner: string;
  readonly status: string;
  readonly quantity: number;
  readonly completed: number;
  readonly cost: number;
  readonly date: string;
  readonly year: string;
  readonly month: string;
  readonly time: string;
  readonly datetime: string;
  readonly active: boolean;
  readonly tags: string;
  readonly note: string;
  readonly parentId: string | null;
  readonly mixed: string | number;
  readonly children?: readonly Task[];
  readonly worksheetKind?: 'item' | 'rate';
  readonly reserved?: number;
  readonly rate?: number;
};

export type TaskGridProps = Partial<OwpDataGridProps<Task, Task>> & {
  readonly gridRef?: RefObject<OwpDataGridRef<Task> | null>;
  readonly callbacks?: TaskGridCallbacks;
};

/** 예제의 사용자 동작·데이터 갱신·설정 변경을 부모 화면과 연결합니다. */
export type TaskGridCallbacks = {
  readonly onAction?: (name: string, value: unknown) => void;
  readonly onDataChange?: (rows: readonly Task[]) => void;
  readonly onLoadingChange?: (loading: boolean) => void;
  readonly onRadiusChange?: (radius: number) => void;
  readonly onSelectionModeChange?: (mode: OwpDataGridRowSelectionMode) => void;
};
