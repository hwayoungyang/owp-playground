import type { ComponentType } from 'react';
import { SelectionGrid } from '../examples/selection';
import type { GridViewProps } from '../model/gridTypes';
import type { TaskGridProps } from '../types';

/** 소비앱 예제에는 native props와 Ref만 전달하고 관찰용 콜백은 runtime에서 처리합니다. */
export function withTaskGridPreview(Component: ComponentType<TaskGridProps>) {
  return function TaskGridPreview({
    onRecord,
    onRowsChange,
    onBusyChange,
    onRadiusChange,
    onSelectionModeChange,
    ...gridProps
  }: GridViewProps) {
    return <Component {...gridProps} />;
  };
}

export function TaskSelectionPreview({
  onRecord,
  onRowsChange,
  onBusyChange,
  onRadiusChange,
  onSelectionModeChange,
  ...gridProps
}: GridViewProps) {
  return (
    <SelectionGrid
      {...gridProps}
      onSelectionModeChange={(mode) => {
        onSelectionModeChange?.(mode);
        onRecord?.('rowSelectionMode', mode);
      }}
    />
  );
}
