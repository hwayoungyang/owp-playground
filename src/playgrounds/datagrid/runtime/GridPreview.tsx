import { useOwpTranslation, useResponsiveDevice } from '@owp/components/hooks';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { GridExample } from '../catalog';
import { gridRegistry } from '../model/gridRegistry';
import type { GridViewProps } from '../model/gridTypes';
import type { GridViewSettings } from './GridSettingsDrawer';
import type { GridController } from './useGridController';

export function GridPreview({
  example,
  controller,
  settings,
  themeRadius,
  onSelectionModeChange,
}: {
  readonly example: GridExample;
  readonly controller: GridController;
  readonly settings: GridViewSettings;
  readonly themeRadius?: number;
  readonly onSelectionModeChange: GridViewProps['onSelectionModeChange'];
}) {
  const { finishBinding, onRowsUpdate } = controller;
  const { t } = useOwpTranslation();
  const { isTabletOrDown } = useResponsiveDevice();
  const gridHost = useRef<HTMLElement>(null);
  const GridView = gridRegistry[example.id].Component;
  const fitRows = controller.configuration.visibleRowCount !== undefined;
  useLayoutEffect(() => {
    if (example.id !== 'worksheet' || isTabletOrDown) return;
    const host = gridHost.current;
    const main = host?.closest<HTMLElement>('.main-content');
    const workspace = host?.closest<HTMLElement>('.workspace');
    if (!host || !main || !workspace) return;
    const fitWorksheet = () => {
      if (!host.getClientRects().length) return;
      const mainStyle = getComputedStyle(main);
      const surrounding =
        workspace.getBoundingClientRect().height - host.getBoundingClientRect().height;
      const available =
        main.clientHeight -
        Number.parseFloat(mainStyle.paddingTop) -
        Number.parseFloat(mainStyle.paddingBottom) -
        surrounding;
      const height = Math.max(420, Math.min(480, Math.floor(available)));
      if (host.style.height !== `${height}px`) host.style.height = `${height}px`;
    };
    fitWorksheet();
    const observer = new ResizeObserver(fitWorksheet);
    for (const element of [main, workspace]) observer.observe(element);
    return () => {
      observer.disconnect();
      host.style.removeProperty('height');
    };
  }, [example.id, gridHost, isTabletOrDown]);
  useLayoutEffect(() => {
    const pending = controller.pendingBinding;
    if (!pending || controller.busy) return;
    let frame = 0;
    const waitForRows = () => {
      if (pending.controller.signal.aborted) return;
      const rendered = gridHost.current?.querySelector(
        '.OwpDataGrid-row[data-owp-data-grid-row-key]',
      );
      if (!controller.gridApi.getRow(`task-${pending.count}`) || !rendered) {
        frame = requestAnimationFrame(waitForRows);
        return;
      }
      // The next frame runs after the bound rows have had a chance to paint.
      frame = requestAnimationFrame(() => finishBinding(pending));
    };
    frame = requestAnimationFrame(waitForRows);
    return () => cancelAnimationFrame(frame);
  }, [controller.pendingBinding, controller.busy, controller.gridApi, finishBinding, gridHost]);
  useEffect(() => {
    if (controller.configuration.treeOptions?.getChildren) {
      onRowsUpdate(controller.gridApi.getRows());
    }
  }, [controller.configuration.treeOptions, controller.gridApi, controller.rows, onRowsUpdate]);
  const handleCommit: NonNullable<typeof controller.configuration.onCellValueCommit> = (params) => {
    controller.record('cell.commit', {
      rowId: params.rowId,
      columnId: params.column.id,
      before: params.previousValue,
      after: params.value,
    });
  };
  return (
    <section
      ref={gridHost}
      className={`grid-preview${(themeRadius ?? settings.radius) ? ' rounded' : ''}`}
      data-sample={example.id}
      data-fit-rows={fitRows || undefined}
      aria-label={`${t(example.title)} ${t('그리드와 조작 영역')}`}
    >
      <div className="grid-preview-content">
        <GridView
          key={controller.gridVersion}
          {...controller.configuration}
          api={controller.gridApi}
          {...(example.id === 'selection' ? { onSelectionModeChange } : {})}
          onRecord={controller.record}
          onRowsChange={onRowsUpdate}
          onBusyChange={controller.setBusy}
          rows={controller.rows}
          columns={controller.columns}
          height={fitRows ? 'auto' : '100%'}
          radius={themeRadius ?? settings.radius}
          layout={{ ...controller.configuration.layout, filterRow: settings.filter }}
          rowSelectionMode={settings.selection}
          rowSelectionModel={controller.selected}
          onRowSelectionModelChange={controller.onSelection}
          sortModel={controller.sort}
          onSortModelChange={controller.onSort}
          filterModel={controller.filters}
          onFilterModelChange={controller.onFilter}
          loading={controller.loading || controller.busy}
          errorOverlay={
            controller.error
              ? {
                  message: t('작업을 불러오지 못했습니다.'),
                  onRetry: controller.retry,
                  retryLabel: t('다시 시도'),
                }
              : undefined
          }
          virtualization={
            controller.configuration.visibleRowCount
              ? false
              : {
                  ...controller.configuration.virtualization,
                  rowHeight: settings.compact ? 32 : 40,
                }
          }
          onChangesChange={controller.onChanges}
          onCellValueCommit={handleCommit}
          onCellClick={({ rowId, column }) =>
            controller.record('cell.click', { rowId, columnId: column.id })
          }
          aria-label={t(example.title)}
        />
      </div>
    </section>
  );
}
