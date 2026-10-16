import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { GridExample } from '../catalog';
import { gridRegistry } from '../model/gridRegistry';
import type { GridViewSettings } from './GridSettingsDrawer';
import { useGridAccessibility } from './useGridAccessibility';
import type { GridController } from './useGridController';

export function GridPreview({
  example,
  controller,
  settings,
  themeRadius,
}: {
  readonly example: GridExample;
  readonly controller: GridController;
  readonly settings: GridViewSettings;
  readonly themeRadius?: number;
}) {
  const { t } = useTranslation('app');
  const gridHost = useGridAccessibility();
  const GridView = gridRegistry[example.id].Component;
  useLayoutEffect(() => {
    if (example.id !== 'worksheet') return;
    const host = gridHost.current;
    const main = host?.closest<HTMLElement>('.main-content');
    const workspace = host?.closest<HTMLElement>('.workspace');
    const footer = main?.querySelector<HTMLElement>('.main-footer');
    if (!host || !main || !workspace || !footer) return;
    const fitWorksheet = () => {
      if (!host.getClientRects().length) return;
      const mainStyle = getComputedStyle(main);
      const footerStyle = getComputedStyle(footer);
      const surrounding =
        workspace.getBoundingClientRect().height - host.getBoundingClientRect().height;
      const available =
        main.clientHeight -
        Number.parseFloat(mainStyle.paddingTop) -
        Number.parseFloat(mainStyle.paddingBottom) -
        surrounding -
        footer.offsetHeight -
        Number.parseFloat(footerStyle.marginTop);
      const height = Math.max(220, Math.min(480, Math.floor(available)));
      if (host.style.height !== `${height}px`) host.style.height = `${height}px`;
    };
    fitWorksheet();
    const observer = new ResizeObserver(fitWorksheet);
    for (const element of [main, workspace, footer]) observer.observe(element);
    return () => {
      observer.disconnect();
      host.style.removeProperty('height');
    };
  }, [example.id, gridHost]);
  useLayoutEffect(() => {
    const pending = controller.pendingBinding;
    if (!pending || controller.busy) return;
    let frame = 0;
    const waitForRows = () => {
      if (pending.controller.signal.aborted) return;
      const rendered = gridHost.current?.querySelector(
        '.OwpDataGrid-row[data-owp-data-grid-row-key]',
      );
      if (!controller.gridRef.current?.getRow(`task-${pending.count}`) || !rendered) {
        frame = requestAnimationFrame(waitForRows);
        return;
      }
      // The next frame runs after the bound rows have had a chance to paint.
      frame = requestAnimationFrame(() => controller.finishBinding(pending));
    };
    frame = requestAnimationFrame(waitForRows);
    return () => cancelAnimationFrame(frame);
  }, [
    controller.pendingBinding,
    controller.busy,
    controller.gridRef,
    controller.finishBinding,
    gridHost,
  ]);
  useEffect(() => {
    if (controller.configuration.treeOptions?.getChildren) {
      controller.onRowsUpdate(controller.gridRef.current?.getRows() ?? controller.rows);
    }
  }, [
    controller.configuration.treeOptions,
    controller.gridRef,
    controller.rows,
    controller.onRowsUpdate,
  ]);
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
      aria-label={`${t(example.title)} ${t('그리드와 탐색 컨트롤')}`}
    >
      <div className="grid-preview-content">
        <GridView
          key={controller.gridVersion}
          {...controller.configuration}
          gridRef={controller.gridRef}
          onRecord={controller.record}
          onRowsChange={controller.onRowsUpdate}
          onBusyChange={controller.setBusy}
          rows={controller.rows}
          columns={controller.columns}
          height="100%"
          style={
            controller.configuration.visibleRowCount
              ? controller.configuration.style
              : { ...controller.configuration.style, height: '100%' }
          }
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
                  retryLabel: t('다시 불러오기'),
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
