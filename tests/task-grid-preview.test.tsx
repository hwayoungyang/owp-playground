import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { initialTasks } from '../src/playgrounds/datagrid/model/data';
import { withTaskGridPreview } from '../src/playgrounds/datagrid/runtime/taskGridPreview';
import type { TaskGridProps } from '../src/playgrounds/datagrid/types';

function renderPreview(props: Parameters<ReturnType<typeof withTaskGridPreview>>[0]) {
  let received: TaskGridProps | undefined;
  const Preview = withTaskGridPreview((next) => {
    received = next;
    return null;
  });
  renderToStaticMarkup(<Preview {...props} />);
  if (!received) throw new Error('Preview did not render the sample');
  return received;
}

describe('task grid preview callback boundary', () => {
  it('forwards native props and ref while isolating preview observers', () => {
    const gridRef = createRef<null>();
    const onRowSelectionModelChange = vi.fn();
    const received = renderPreview({
      height: 320,
      rows: initialTasks,
      gridRef,
      onRowSelectionModelChange,
      onRecord: vi.fn(),
      onRowsChange: vi.fn(),
      onBusyChange: vi.fn(),
      onRadiusChange: vi.fn(),
      onSelectionModeChange: vi.fn(),
    });

    expect(received).toMatchObject({
      height: 320,
      rows: initialTasks,
      gridRef,
      onRowSelectionModelChange,
    });
    for (const key of [
      'onRecord',
      'onRowsChange',
      'onBusyChange',
      'onRadiusChange',
      'onSelectionModeChange',
    ]) {
      expect(received).not.toHaveProperty(key);
    }
  });

  it('preserves observer payloads and selection mode event ordering', () => {
    const calls: unknown[] = [];
    const received = renderPreview({
      onRecord: (name, value) => calls.push(['action', name, value]),
      onRowsChange: (rows) => calls.push(['data', rows]),
      onBusyChange: (loading) => calls.push(['loading', loading]),
      onRadiusChange: (radius) => calls.push(['radius', radius]),
      onSelectionModeChange: (mode) => calls.push(['mode', mode]),
    });

    received.callbacks?.onAction?.('addRow', { success: true });
    received.callbacks?.onDataChange?.(initialTasks);
    received.callbacks?.onLoadingChange?.(true);
    received.callbacks?.onRadiusChange?.(8);
    received.callbacks?.onSelectionModeChange?.('multiple');

    expect(calls).toEqual([
      ['action', 'addRow', { success: true }],
      ['data', initialTasks],
      ['loading', true],
      ['radius', 8],
      ['mode', 'multiple'],
      ['action', 'rowSelectionMode', 'multiple'],
    ]);
  });

  it('allows every observer to be omitted', () => {
    const { callbacks } = renderPreview({});
    expect(() => callbacks?.onSelectionModeChange?.('none')).not.toThrow();
  });
});
