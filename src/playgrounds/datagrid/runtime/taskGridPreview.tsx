import { type ComponentType, useMemo } from 'react';
import { SelectionGrid } from '../examples/selection';
import type { GridViewProps } from '../model/gridTypes';
import type { TaskGridCallbacks, TaskGridProps } from '../types';

/** 미리보기 관찰용 콜백을 앱에서도 사용할 수 있는 예제 콜백으로 연결합니다. */
export function withTaskGridPreview(Component: ComponentType<TaskGridProps>) {
  return function TaskGridPreview({
    onRecord,
    onRowsChange,
    onBusyChange,
    onRadiusChange,
    onSelectionModeChange,
    ...gridProps
  }: GridViewProps) {
    const callbacks = useMemo<TaskGridCallbacks>(
      () => ({
        onAction: onRecord,
        onDataChange: onRowsChange,
        onLoadingChange: onBusyChange,
        onRadiusChange,
        onSelectionModeChange: (mode) => {
          onSelectionModeChange?.(mode);
          onRecord?.('rowSelectionMode', mode);
        },
      }),
      [onRecord, onRowsChange, onBusyChange, onRadiusChange, onSelectionModeChange],
    );
    return <Component {...gridProps} callbacks={callbacks} />;
  };
}

export const TaskSelectionPreview = withTaskGridPreview(SelectionGrid);
