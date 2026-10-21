import type { ComponentType } from 'react';
import type { GridExampleId } from '../catalog';
import { TaskSelectionPreview, withTaskGridPreview } from '../runtime/taskGridPreview';
import {
  AutomaticRowSpanGrid,
  gridConfiguration as autoSpanConfiguration,
} from '../examples/auto-span';
import { CellTypesGrid, gridConfiguration as cellTypesConfiguration } from '../examples/cell-types';
import {
  ClickEventsGrid,
  gridConfiguration as clickEventsConfiguration,
} from '../examples/click-events';
import {
  gridConfiguration as columnLayoutConfiguration,
  PinnedColumnsGrid,
} from '../examples/column-layout';
import {
  ColumnSpanGrid,
  gridConfiguration as columnSpanConfiguration,
} from '../examples/column-span';
import {
  CombinedSpanGrid,
  gridConfiguration as combinedSpanConfiguration,
} from '../examples/combined-span';
import {
  ConditionalStylesGrid,
  gridConfiguration as conditionalConfiguration,
} from '../examples/conditional';
import {
  ContextMenuGrid,
  gridConfiguration as contextMenuConfiguration,
} from '../examples/context-menu';
import {
  gridConfiguration as customStyleConfiguration,
  StyledHeadersGrid,
} from '../examples/custom-style';
import {
  gridConfiguration as designSystemConfiguration,
  ExternalControlsGrid,
} from '../examples/design-system';
import {
  gridConfiguration as detailCustomConfiguration,
  ProjectDetailsGrid,
} from '../examples/detail-custom';
import {
  gridConfiguration as detailGridConfiguration,
  NestedDetailsGrid,
} from '../examples/detail-grid';
import { EditableCellsGrid, gridConfiguration as editingConfiguration } from '../examples/editing';
import { GridStates, gridConfiguration as statesConfiguration } from '../examples/states';
import { ExcelExportGrid, gridConfiguration as excelConfiguration } from '../examples/excel';
import {
  ExcelSnapshotGrid,
  gridConfiguration as excelSnapshotConfiguration,
} from '../examples/excel-snapshot';
import {
  gridConfiguration as externalValidationConfiguration,
  ValidationMessagesGrid,
} from '../examples/external-validation';
import {
  ColumnFiltersGrid,
  gridConfiguration as filteringConfiguration,
} from '../examples/filtering';
import {
  gridConfiguration as formattingConfiguration,
  NumberDateFormatsGrid,
} from '../examples/formatting';
import { GroupedHeadersGrid, gridConfiguration as headersConfiguration } from '../examples/headers';
import {
  HookConnectionGrid,
  gridConfiguration as hookConnectionConfiguration,
} from '../examples/hook-connection';
import {
  LargeDatasetGrid,
  gridConfiguration as largeDataConfiguration,
} from '../examples/large-data';
import {
  gridConfiguration as mixedTypesConfiguration,
  RowCellTypesGrid,
} from '../examples/mixed-types';
import {
  NestedTaskTreeGrid,
  gridConfiguration as nestedTreeConfiguration,
} from '../examples/nested-tree';
import {
  OverflowHintsGrid,
  gridConfiguration as overflowHintConfiguration,
} from '../examples/overflow-hint';
import { FixedRowsGrid, gridConfiguration as overviewConfiguration } from '../examples/overview';
import {
  ChangeTrackingGrid,
  gridConfiguration as refChangesConfiguration,
} from '../examples/ref-changes';
import { BatchRowsGrid, gridConfiguration as refDataConfiguration } from '../examples/ref-data';
import { CellFocusGrid, gridConfiguration as refFocusConfiguration } from '../examples/ref-focus';
import { MoveRowsGrid, gridConfiguration as refMoveConfiguration } from '../examples/ref-move';
import {
  RefConnectionGrid,
  gridConfiguration as refConnectionConfiguration,
} from '../examples/ref-connection';
import { CellRendererGrid, gridConfiguration as rendererConfiguration } from '../examples/renderer';
import {
  DraggableRowsGrid,
  gridConfiguration as reorderingConfiguration,
} from '../examples/reordering';
import {
  RowEditingGrid,
  gridConfiguration as rowActionsConfiguration,
} from '../examples/row-actions';
import {
  DeleteRestoreRowsGrid,
  gridConfiguration as rowDeletionConfiguration,
} from '../examples/row-deletion';
import {
  RowInsertionGrid,
  gridConfiguration as rowInsertionConfiguration,
} from '../examples/row-insertion';
import {
  ExplicitRowSpanGrid,
  gridConfiguration as rowSpanConfiguration,
} from '../examples/row-span';
import { SelectEditorsGrid, gridConfiguration as selectConfiguration } from '../examples/select';
import { gridConfiguration as selectionConfiguration } from '../examples/selection';
import {
  ServerSaveGrid,
  gridConfiguration as serverSaveConfiguration,
} from '../examples/server-save';
import {
  NewRowSelectionGrid,
  gridConfiguration as selectionPolicyConfiguration,
} from '../examples/selection-policy';
import {
  ServerQueryGrid,
  gridConfiguration as serverModeConfiguration,
} from '../examples/server-mode';
import { MultiSortGrid, gridConfiguration as sortingConfiguration } from '../examples/sorting';
import {
  MergedCellsExportGrid,
  gridConfiguration as spanExportConfiguration,
} from '../examples/span-export';
import {
  gridConfiguration as spanScrollConfiguration,
  VirtualizedSpansGrid,
} from '../examples/span-scroll';
import {
  SummaryRowsGrid,
  gridConfiguration as summaryRowsConfiguration,
} from '../examples/summary-rows';
import { TaskTreeGrid, gridConfiguration as treeConfiguration } from '../examples/tree';
import {
  SpanningTreeGrid,
  gridConfiguration as treeSpanConfiguration,
} from '../examples/tree-span';
import {
  InputValidationGrid,
  gridConfiguration as validationConfiguration,
} from '../examples/validation';
import {
  CalculatedCellsGrid,
  gridConfiguration as worksheetConfiguration,
} from '../examples/worksheet';
import type { GridConfiguration, GridViewProps } from './gridTypes';

export const gridRegistry = {
  overview: { Component: withTaskGridPreview(FixedRowsGrid), configuration: overviewConfiguration },
  'design-system': {
    Component: withTaskGridPreview(ExternalControlsGrid),
    configuration: designSystemConfiguration,
  },
  states: { Component: withTaskGridPreview(GridStates), configuration: statesConfiguration },
  'cell-types': {
    Component: withTaskGridPreview(CellTypesGrid),
    configuration: cellTypesConfiguration,
  },
  select: { Component: withTaskGridPreview(SelectEditorsGrid), configuration: selectConfiguration },
  selection: { Component: TaskSelectionPreview, configuration: selectionConfiguration },
  'custom-style': {
    Component: withTaskGridPreview(StyledHeadersGrid),
    configuration: customStyleConfiguration,
  },
  formatting: {
    Component: withTaskGridPreview(NumberDateFormatsGrid),
    configuration: formattingConfiguration,
  },
  'mixed-types': {
    Component: withTaskGridPreview(RowCellTypesGrid),
    configuration: mixedTypesConfiguration,
  },
  renderer: {
    Component: withTaskGridPreview(CellRendererGrid),
    configuration: rendererConfiguration,
  },
  conditional: {
    Component: withTaskGridPreview(ConditionalStylesGrid),
    configuration: conditionalConfiguration,
  },
  'overflow-hint': {
    Component: withTaskGridPreview(OverflowHintsGrid),
    configuration: overflowHintConfiguration,
  },
  'column-layout': {
    Component: withTaskGridPreview(PinnedColumnsGrid),
    configuration: columnLayoutConfiguration,
  },
  headers: {
    Component: withTaskGridPreview(GroupedHeadersGrid),
    configuration: headersConfiguration,
  },
  'row-span': {
    Component: withTaskGridPreview(ExplicitRowSpanGrid),
    configuration: rowSpanConfiguration,
  },
  'auto-span': {
    Component: withTaskGridPreview(AutomaticRowSpanGrid),
    configuration: autoSpanConfiguration,
  },
  'column-span': {
    Component: withTaskGridPreview(ColumnSpanGrid),
    configuration: columnSpanConfiguration,
  },
  'combined-span': {
    Component: withTaskGridPreview(CombinedSpanGrid),
    configuration: combinedSpanConfiguration,
  },
  'span-scroll': {
    Component: withTaskGridPreview(VirtualizedSpansGrid),
    configuration: spanScrollConfiguration,
  },
  'span-export': {
    Component: withTaskGridPreview(MergedCellsExportGrid),
    configuration: spanExportConfiguration,
  },
  'selection-policy': {
    Component: withTaskGridPreview(NewRowSelectionGrid),
    configuration: selectionPolicyConfiguration,
  },
  sorting: { Component: withTaskGridPreview(MultiSortGrid), configuration: sortingConfiguration },
  filtering: {
    Component: withTaskGridPreview(ColumnFiltersGrid),
    configuration: filteringConfiguration,
  },
  editing: {
    Component: withTaskGridPreview(EditableCellsGrid),
    configuration: editingConfiguration,
  },
  'save-changes': {
    Component: withTaskGridPreview(ServerSaveGrid),
    configuration: serverSaveConfiguration,
  },
  validation: {
    Component: withTaskGridPreview(InputValidationGrid),
    configuration: validationConfiguration,
  },
  'row-actions': {
    Component: withTaskGridPreview(RowEditingGrid),
    configuration: rowActionsConfiguration,
  },
  reordering: {
    Component: withTaskGridPreview(DraggableRowsGrid),
    configuration: reorderingConfiguration,
  },
  'context-menu': {
    Component: withTaskGridPreview(ContextMenuGrid),
    configuration: contextMenuConfiguration,
  },
  'hook-connection': {
    Component: withTaskGridPreview(HookConnectionGrid),
    configuration: hookConnectionConfiguration,
  },
  'ref-connection': {
    Component: withTaskGridPreview(RefConnectionGrid),
    configuration: refConnectionConfiguration,
  },
  'ref-data': {
    Component: withTaskGridPreview(BatchRowsGrid),
    configuration: refDataConfiguration,
  },
  'ref-focus': {
    Component: withTaskGridPreview(CellFocusGrid),
    configuration: refFocusConfiguration,
  },
  'click-events': {
    Component: withTaskGridPreview(ClickEventsGrid),
    configuration: clickEventsConfiguration,
  },
  'row-insertion': {
    Component: withTaskGridPreview(RowInsertionGrid),
    configuration: rowInsertionConfiguration,
  },
  'row-deletion': {
    Component: withTaskGridPreview(DeleteRestoreRowsGrid),
    configuration: rowDeletionConfiguration,
  },
  'ref-move': { Component: withTaskGridPreview(MoveRowsGrid), configuration: refMoveConfiguration },
  'ref-changes': {
    Component: withTaskGridPreview(ChangeTrackingGrid),
    configuration: refChangesConfiguration,
  },
  'external-validation': {
    Component: withTaskGridPreview(ValidationMessagesGrid),
    configuration: externalValidationConfiguration,
  },
  'excel-snapshot': {
    Component: withTaskGridPreview(ExcelSnapshotGrid),
    configuration: excelSnapshotConfiguration,
  },
  'summary-rows': {
    Component: withTaskGridPreview(SummaryRowsGrid),
    configuration: summaryRowsConfiguration,
  },
  worksheet: {
    Component: withTaskGridPreview(CalculatedCellsGrid),
    configuration: worksheetConfiguration,
  },
  tree: { Component: withTaskGridPreview(TaskTreeGrid), configuration: treeConfiguration },
  'nested-tree': {
    Component: withTaskGridPreview(NestedTaskTreeGrid),
    configuration: nestedTreeConfiguration,
  },
  'tree-span': {
    Component: withTaskGridPreview(SpanningTreeGrid),
    configuration: treeSpanConfiguration,
  },
  'detail-custom': {
    Component: withTaskGridPreview(ProjectDetailsGrid),
    configuration: detailCustomConfiguration,
  },
  'detail-grid': {
    Component: withTaskGridPreview(NestedDetailsGrid),
    configuration: detailGridConfiguration,
  },
  excel: { Component: withTaskGridPreview(ExcelExportGrid), configuration: excelConfiguration },
  'server-mode': {
    Component: withTaskGridPreview(ServerQueryGrid),
    configuration: serverModeConfiguration,
  },
  'large-data': {
    Component: withTaskGridPreview(LargeDatasetGrid),
    configuration: largeDataConfiguration,
  },
} satisfies Readonly<
  Record<
    GridExampleId,
    { readonly Component: ComponentType<GridViewProps>; readonly configuration: GridConfiguration }
  >
>;
