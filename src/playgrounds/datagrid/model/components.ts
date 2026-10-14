import type { ComponentType } from 'react';
import type { SampleId } from '../catalog';
import * as AutoSpanExampleModule from '../examples/auto-span';
import * as CellTypesExampleModule from '../examples/cell-types';
import * as ClickEventsExampleModule from '../examples/click-events';
import * as ColumnLayoutExampleModule from '../examples/column-layout';
import * as ColumnSpanExampleModule from '../examples/column-span';
import * as CombinedSpanExampleModule from '../examples/combined-span';
import * as ConditionalExampleModule from '../examples/conditional';
import * as ContextMenuExampleModule from '../examples/context-menu';
import * as CustomStyleExampleModule from '../examples/custom-style';
import * as DesignSystemExampleModule from '../examples/design-system';
import * as DetailCustomExampleModule from '../examples/detail-custom';
import * as DetailGridExampleModule from '../examples/detail-grid';
import * as EditingExampleModule from '../examples/editing';
import * as EmptyExampleModule from '../examples/empty';
import * as ErrorExampleModule from '../examples/error';
import * as ExcelExampleModule from '../examples/excel';
import * as ExcelSnapshotExampleModule from '../examples/excel-snapshot';
import * as ExternalValidationExampleModule from '../examples/external-validation';
import * as FilteringExampleModule from '../examples/filtering';
import * as FormattingExampleModule from '../examples/formatting';
import * as HeadersExampleModule from '../examples/headers';
import * as LargeDataExampleModule from '../examples/large-data';
import * as MixedTypesExampleModule from '../examples/mixed-types';
import * as NestedTreeExampleModule from '../examples/nested-tree';
import * as OverflowHintExampleModule from '../examples/overflow-hint';
import * as OverviewExampleModule from '../examples/overview';
import * as RefChangesExampleModule from '../examples/ref-changes';
import * as RefDataExampleModule from '../examples/ref-data';
import * as RefFocusExampleModule from '../examples/ref-focus';
import * as RefMoveExampleModule from '../examples/ref-move';
import * as RendererExampleModule from '../examples/renderer';
import * as ReorderingExampleModule from '../examples/reordering';
import * as RowActionsExampleModule from '../examples/row-actions';
import * as RowDeletionExampleModule from '../examples/row-deletion';
import * as RowInsertionExampleModule from '../examples/row-insertion';
import * as RowSpanExampleModule from '../examples/row-span';
import * as SelectExampleModule from '../examples/select';
import * as SelectionPolicyExampleModule from '../examples/selection-policy';
import * as ServerModeExampleModule from '../examples/server-mode';
import * as SortingExampleModule from '../examples/sorting';
import * as SpanExportExampleModule from '../examples/span-export';
import * as SpanScrollExampleModule from '../examples/span-scroll';
import * as SummaryRowsExampleModule from '../examples/summary-rows';
import * as TreeExampleModule from '../examples/tree';
import * as TreeSpanExampleModule from '../examples/tree-span';
import * as ValidationExampleModule from '../examples/validation';
import * as WorksheetExampleModule from '../examples/worksheet';
import type { Definition, ExampleProps } from './types';

export const sampleComponents = {
  overview: OverviewExampleModule.OwpDataGridExample,
  'design-system': DesignSystemExampleModule.OwpDataGridExample,
  empty: EmptyExampleModule.OwpDataGridExample,
  error: ErrorExampleModule.OwpDataGridExample,
  'cell-types': CellTypesExampleModule.OwpDataGridExample,
  select: SelectExampleModule.OwpDataGridExample,
  'custom-style': CustomStyleExampleModule.OwpDataGridExample,
  formatting: FormattingExampleModule.OwpDataGridExample,
  'mixed-types': MixedTypesExampleModule.OwpDataGridExample,
  renderer: RendererExampleModule.OwpDataGridExample,
  conditional: ConditionalExampleModule.OwpDataGridExample,
  'overflow-hint': OverflowHintExampleModule.OwpDataGridExample,
  'column-layout': ColumnLayoutExampleModule.OwpDataGridExample,
  headers: HeadersExampleModule.OwpDataGridExample,
  'row-span': RowSpanExampleModule.OwpDataGridExample,
  'auto-span': AutoSpanExampleModule.OwpDataGridExample,
  'column-span': ColumnSpanExampleModule.OwpDataGridExample,
  'combined-span': CombinedSpanExampleModule.OwpDataGridExample,
  'span-scroll': SpanScrollExampleModule.OwpDataGridExample,
  'span-export': SpanExportExampleModule.OwpDataGridExample,
  'selection-policy': SelectionPolicyExampleModule.OwpDataGridExample,
  sorting: SortingExampleModule.OwpDataGridExample,
  filtering: FilteringExampleModule.OwpDataGridExample,
  editing: EditingExampleModule.OwpDataGridExample,
  validation: ValidationExampleModule.OwpDataGridExample,
  'row-actions': RowActionsExampleModule.OwpDataGridExample,
  reordering: ReorderingExampleModule.OwpDataGridExample,
  'context-menu': ContextMenuExampleModule.OwpDataGridExample,
  'ref-data': RefDataExampleModule.OwpDataGridExample,
  'ref-focus': RefFocusExampleModule.OwpDataGridExample,
  'click-events': ClickEventsExampleModule.OwpDataGridExample,
  'row-insertion': RowInsertionExampleModule.OwpDataGridExample,
  'row-deletion': RowDeletionExampleModule.OwpDataGridExample,
  'ref-move': RefMoveExampleModule.OwpDataGridExample,
  'ref-changes': RefChangesExampleModule.OwpDataGridExample,
  'external-validation': ExternalValidationExampleModule.OwpDataGridExample,
  'excel-snapshot': ExcelSnapshotExampleModule.OwpDataGridExample,
  'summary-rows': SummaryRowsExampleModule.OwpDataGridExample,
  worksheet: WorksheetExampleModule.OwpDataGridExample,
  tree: TreeExampleModule.OwpDataGridExample,
  'nested-tree': NestedTreeExampleModule.OwpDataGridExample,
  'tree-span': TreeSpanExampleModule.OwpDataGridExample,
  'detail-custom': DetailCustomExampleModule.OwpDataGridExample,
  'detail-grid': DetailGridExampleModule.OwpDataGridExample,
  excel: ExcelExampleModule.OwpDataGridExample,
  'server-mode': ServerModeExampleModule.OwpDataGridExample,
  'large-data': LargeDataExampleModule.OwpDataGridExample,
} satisfies Readonly<Record<SampleId, ComponentType<ExampleProps>>>;

export const sampleDefinitions = {
  overview: OverviewExampleModule.exampleDefinition,
  'design-system': DesignSystemExampleModule.exampleDefinition,
  empty: EmptyExampleModule.exampleDefinition,
  error: ErrorExampleModule.exampleDefinition,
  'cell-types': CellTypesExampleModule.exampleDefinition,
  select: SelectExampleModule.exampleDefinition,
  'custom-style': CustomStyleExampleModule.exampleDefinition,
  formatting: FormattingExampleModule.exampleDefinition,
  'mixed-types': MixedTypesExampleModule.exampleDefinition,
  renderer: RendererExampleModule.exampleDefinition,
  conditional: ConditionalExampleModule.exampleDefinition,
  'overflow-hint': OverflowHintExampleModule.exampleDefinition,
  'column-layout': ColumnLayoutExampleModule.exampleDefinition,
  headers: HeadersExampleModule.exampleDefinition,
  'row-span': RowSpanExampleModule.exampleDefinition,
  'auto-span': AutoSpanExampleModule.exampleDefinition,
  'column-span': ColumnSpanExampleModule.exampleDefinition,
  'combined-span': CombinedSpanExampleModule.exampleDefinition,
  'span-scroll': SpanScrollExampleModule.exampleDefinition,
  'span-export': SpanExportExampleModule.exampleDefinition,
  'selection-policy': SelectionPolicyExampleModule.exampleDefinition,
  sorting: SortingExampleModule.exampleDefinition,
  filtering: FilteringExampleModule.exampleDefinition,
  editing: EditingExampleModule.exampleDefinition,
  validation: ValidationExampleModule.exampleDefinition,
  'row-actions': RowActionsExampleModule.exampleDefinition,
  reordering: ReorderingExampleModule.exampleDefinition,
  'context-menu': ContextMenuExampleModule.exampleDefinition,
  'ref-data': RefDataExampleModule.exampleDefinition,
  'ref-focus': RefFocusExampleModule.exampleDefinition,
  'click-events': ClickEventsExampleModule.exampleDefinition,
  'row-insertion': RowInsertionExampleModule.exampleDefinition,
  'row-deletion': RowDeletionExampleModule.exampleDefinition,
  'ref-move': RefMoveExampleModule.exampleDefinition,
  'ref-changes': RefChangesExampleModule.exampleDefinition,
  'external-validation': ExternalValidationExampleModule.exampleDefinition,
  'excel-snapshot': ExcelSnapshotExampleModule.exampleDefinition,
  'summary-rows': SummaryRowsExampleModule.exampleDefinition,
  worksheet: WorksheetExampleModule.exampleDefinition,
  tree: TreeExampleModule.exampleDefinition,
  'nested-tree': NestedTreeExampleModule.exampleDefinition,
  'tree-span': TreeSpanExampleModule.exampleDefinition,
  'detail-custom': DetailCustomExampleModule.exampleDefinition,
  'detail-grid': DetailGridExampleModule.exampleDefinition,
  excel: ExcelExampleModule.exampleDefinition,
  'server-mode': ServerModeExampleModule.exampleDefinition,
  'large-data': LargeDataExampleModule.exampleDefinition,
} satisfies Readonly<Record<SampleId, Definition>>;
