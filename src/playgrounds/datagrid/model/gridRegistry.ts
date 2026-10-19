import type { ComponentType } from 'react';
import type { GridExampleId } from '../catalog';
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
import { SelectionGrid, gridConfiguration as selectionConfiguration } from '../examples/selection';
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
  overview: { Component: FixedRowsGrid, configuration: overviewConfiguration },
  'design-system': { Component: ExternalControlsGrid, configuration: designSystemConfiguration },
  states: { Component: GridStates, configuration: statesConfiguration },
  'cell-types': { Component: CellTypesGrid, configuration: cellTypesConfiguration },
  select: { Component: SelectEditorsGrid, configuration: selectConfiguration },
  selection: { Component: SelectionGrid, configuration: selectionConfiguration },
  'custom-style': { Component: StyledHeadersGrid, configuration: customStyleConfiguration },
  formatting: { Component: NumberDateFormatsGrid, configuration: formattingConfiguration },
  'mixed-types': { Component: RowCellTypesGrid, configuration: mixedTypesConfiguration },
  renderer: { Component: CellRendererGrid, configuration: rendererConfiguration },
  conditional: { Component: ConditionalStylesGrid, configuration: conditionalConfiguration },
  'overflow-hint': { Component: OverflowHintsGrid, configuration: overflowHintConfiguration },
  'column-layout': { Component: PinnedColumnsGrid, configuration: columnLayoutConfiguration },
  headers: { Component: GroupedHeadersGrid, configuration: headersConfiguration },
  'row-span': { Component: ExplicitRowSpanGrid, configuration: rowSpanConfiguration },
  'auto-span': { Component: AutomaticRowSpanGrid, configuration: autoSpanConfiguration },
  'column-span': { Component: ColumnSpanGrid, configuration: columnSpanConfiguration },
  'combined-span': { Component: CombinedSpanGrid, configuration: combinedSpanConfiguration },
  'span-scroll': { Component: VirtualizedSpansGrid, configuration: spanScrollConfiguration },
  'span-export': { Component: MergedCellsExportGrid, configuration: spanExportConfiguration },
  'selection-policy': {
    Component: NewRowSelectionGrid,
    configuration: selectionPolicyConfiguration,
  },
  sorting: { Component: MultiSortGrid, configuration: sortingConfiguration },
  filtering: { Component: ColumnFiltersGrid, configuration: filteringConfiguration },
  editing: { Component: EditableCellsGrid, configuration: editingConfiguration },
  validation: { Component: InputValidationGrid, configuration: validationConfiguration },
  'row-actions': { Component: RowEditingGrid, configuration: rowActionsConfiguration },
  reordering: { Component: DraggableRowsGrid, configuration: reorderingConfiguration },
  'context-menu': { Component: ContextMenuGrid, configuration: contextMenuConfiguration },
  'ref-data': { Component: BatchRowsGrid, configuration: refDataConfiguration },
  'ref-focus': { Component: CellFocusGrid, configuration: refFocusConfiguration },
  'click-events': { Component: ClickEventsGrid, configuration: clickEventsConfiguration },
  'row-insertion': { Component: RowInsertionGrid, configuration: rowInsertionConfiguration },
  'row-deletion': { Component: DeleteRestoreRowsGrid, configuration: rowDeletionConfiguration },
  'ref-move': { Component: MoveRowsGrid, configuration: refMoveConfiguration },
  'ref-changes': { Component: ChangeTrackingGrid, configuration: refChangesConfiguration },
  'external-validation': {
    Component: ValidationMessagesGrid,
    configuration: externalValidationConfiguration,
  },
  'excel-snapshot': { Component: ExcelSnapshotGrid, configuration: excelSnapshotConfiguration },
  'summary-rows': { Component: SummaryRowsGrid, configuration: summaryRowsConfiguration },
  worksheet: { Component: CalculatedCellsGrid, configuration: worksheetConfiguration },
  tree: { Component: TaskTreeGrid, configuration: treeConfiguration },
  'nested-tree': { Component: NestedTaskTreeGrid, configuration: nestedTreeConfiguration },
  'tree-span': { Component: SpanningTreeGrid, configuration: treeSpanConfiguration },
  'detail-custom': { Component: ProjectDetailsGrid, configuration: detailCustomConfiguration },
  'detail-grid': { Component: NestedDetailsGrid, configuration: detailGridConfiguration },
  excel: { Component: ExcelExportGrid, configuration: excelConfiguration },
  'server-mode': { Component: ServerQueryGrid, configuration: serverModeConfiguration },
  'large-data': { Component: LargeDatasetGrid, configuration: largeDataConfiguration },
} satisfies Readonly<
  Record<
    GridExampleId,
    { readonly Component: ComponentType<GridViewProps>; readonly configuration: GridConfiguration }
  >
>;
