import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { GridSample } from '../catalog';
import { sampleComponents } from '../model/components';
import type { SettingsValue } from './Settings';
import type { Demo } from './useDemo';
import { useGridAccessibility } from './useGridAccessibility';

export function GridPreview({
  sample,
  demo,
  settings,
  themeRadius,
}: {
  readonly sample: GridSample;
  readonly demo: Demo;
  readonly settings: SettingsValue;
  readonly themeRadius?: number;
}) {
  const { t } = useTranslation('app');
  const gridHost = useGridAccessibility();
  const Example = sampleComponents[sample.id];
  useLayoutEffect(() => {
    if (sample.id !== 'worksheet') return;
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
  }, [sample.id, gridHost]);
  useLayoutEffect(() => {
    const pending = demo.pendingBinding;
    if (!pending || demo.busy) return;
    let frame = 0;
    const waitForRows = () => {
      if (pending.controller.signal.aborted) return;
      const rendered = gridHost.current?.querySelector(
        '.OwpDataGrid-row[data-owp-data-grid-row-key]',
      );
      if (!demo.gridRef.current?.getRow(`task-${pending.count}`) || !rendered) {
        frame = requestAnimationFrame(waitForRows);
        return;
      }
      // The next frame runs after the bound rows have had a chance to paint.
      frame = requestAnimationFrame(() => demo.finishBinding(pending));
    };
    frame = requestAnimationFrame(waitForRows);
    return () => cancelAnimationFrame(frame);
  }, [demo.pendingBinding, demo.busy, demo.gridRef, demo.finishBinding, gridHost]);
  useEffect(() => {
    if (demo.definition.treeOptions?.getChildren) {
      demo.onRowsUpdate(demo.gridRef.current?.getRows() ?? demo.rows);
    }
  }, [demo.definition.treeOptions, demo.gridRef, demo.rows, demo.onRowsUpdate]);
  const handleCommit: NonNullable<typeof demo.definition.onCellValueCommit> = (params) => {
    demo.record('cell.commit', {
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
      data-sample={sample.id}
      aria-label={`${t(sample.title)} ${t('그리드와 탐색 컨트롤')}`}
    >
      <div className="grid-preview-content">
        <Example
          key={demo.gridVersion}
          {...demo.definition}
          gridRef={demo.gridRef}
          onRecord={demo.record}
          onRowsChange={demo.onRowsUpdate}
          onBusyChange={demo.setBusy}
          rows={demo.rows}
          columns={demo.columns}
          height="100%"
          style={
            demo.definition.visibleRowCount
              ? demo.definition.style
              : { ...demo.definition.style, height: '100%' }
          }
          radius={themeRadius ?? settings.radius}
          layout={{ ...demo.definition.layout, filterRow: settings.filter }}
          rowSelectionMode={settings.selection}
          rowSelectionModel={demo.selected}
          onRowSelectionModelChange={demo.onSelection}
          sortModel={demo.sort}
          onSortModelChange={demo.onSort}
          filterModel={demo.filters}
          onFilterModelChange={demo.onFilter}
          loading={demo.loading || demo.busy}
          errorOverlay={
            demo.error
              ? {
                  message: t('작업을 불러오지 못했습니다.'),
                  onRetry: demo.retry,
                  retryLabel: t('다시 불러오기'),
                }
              : undefined
          }
          virtualization={
            demo.definition.visibleRowCount
              ? false
              : { ...demo.definition.virtualization, rowHeight: settings.compact ? 32 : 40 }
          }
          onChangesChange={demo.onChanges}
          onCellValueCommit={handleCommit}
          onCellClick={({ rowId, column }) =>
            demo.record('cell.click', { rowId, columnId: column.id })
          }
          aria-label={t(sample.title)}
        />
      </div>
    </section>
  );
}
