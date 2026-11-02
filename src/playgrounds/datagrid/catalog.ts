export const categories = [
  { id: 'columns', label: '셀·컬럼', title: '셀·컬럼' },
  { id: 'styling', label: '스타일', title: '스타일' },
  { id: 'span', label: '셀 병합', title: '셀 병합' },
  { id: 'interaction', label: '선택·이벤트', title: '선택·이벤트' },
  { id: 'sorting', label: '정렬·필터', title: '정렬·필터' },
  { id: 'editing', label: '편집·검증', title: '편집·검증' },
  { id: 'rows', label: '행 관리', title: '행 관리' },
  { id: 'grid-api', label: 'Grid API', title: 'Grid API' },
  { id: 'aggregation', label: '집계·계산', title: '집계·계산' },
  { id: 'hierarchy', label: '트리·상세', title: '트리·상세' },
  { id: 'data', label: '데이터·로딩', title: '데이터·로딩' },
  { id: 'export', label: '내보내기', title: '내보내기' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];

const entry = <T extends string>(
  id: T,
  title: string,
  options: {
    readonly category: CategoryId;
    readonly description: string;
    readonly api: readonly string[];
    readonly source?: string;
  },
) => ({
  id,
  kind: 'grid' as const,
  title,
  package: '@owp/datagrid',
  ...options,
  source: options.source ?? `examples/${id}.tsx`,
});

export const gridCatalog = [
  {
    id: 'getting-started',
    kind: 'guide',
    title: '시작하기',
    package: '@owp/datagrid',
    category: 'start',
    description: '',
    api: [],
    source: 'guides/getting-started.tsx',
  },
  entry('cell-types', '셀 타입', {
    category: 'columns',
    description: '텍스트·숫자·셀렉트·날짜 등 셀 타입에 맞는 편집기를 사용할 수 있습니다.',
    api: ['type', 'editable', 'autocompleteOptions'],
  }),
  entry('mixed-types', '행별 셀 타입', {
    category: 'columns',
    description: '같은 컬럼에서 행마다 다른 편집기를 사용할 수 있습니다.',
    api: ['getCellType'],
  }),
  entry('select', '셀렉트', {
    category: 'columns',
    description: '셀렉트와 자동완성의 단일 선택·다중 선택 동작을 비교할 수 있습니다.',
    api: ['type', 'valueOptions', 'selectOptions.multiple', 'autocompleteOptions.multiple'],
  }),
  entry('formatting', '숫자·날짜 서식', {
    category: 'columns',
    description: '숫자와 날짜·시간 서식을 설정할 수 있습니다.',
    api: ['numberOptions', 'dateOptions', 'timeOptions', 'datetimeOptions'],
  }),
  entry('renderer', '셀 컴포넌트', {
    category: 'columns',
    description: '버튼, 칩, 스위치와 진행률을 셀에 추가할 수 있습니다.',
    api: ['renderCell', 'applyTransaction', 'setCellValue', 'excel'],
  }),
  entry('overflow-hint', '긴 내용 보기', {
    category: 'columns',
    description: '내용이 잘린 셀에 마우스를 올리면 전체 내용을 확인할 수 있습니다.',
    api: ['overflowHint'],
  }),
  entry('column-layout', '고정 컬럼', {
    category: 'columns',
    description: '고정 컬럼과 가로 스크롤 동작을 비교할 수 있습니다.',
    api: ['layout.columnRegions', 'resizable', 'relWidth'],
  }),
  entry('headers', '다단 헤더', {
    category: 'columns',
    description: '다단 헤더 구성과 하위 컬럼 정렬 버튼 표시 여부를 설정할 수 있습니다.',
    api: ['headerRows', 'hideChildHeaderSortButtons'],
  }),
  entry('conditional', '조건부 스타일', {
    category: 'styling',
    description: '조건에 따라 셀·행의 색상과 편집 가능 여부를 다르게 설정할 수 있습니다.',
    api: ['cellStyle', 'editable'],
  }),
  entry('custom-style', '커스텀 스타일', {
    category: 'styling',
    description: '헤더와 셀의 스타일, 글자 크기를 변경할 수 있습니다.',
    api: ['sx', 'headerRows', 'className', 'style', 'cellStyle', 'virtualization.rowHeight'],
  }),
  entry('row-span', '행 수에 따라 병합', {
    category: 'span',
    description: '셀 값과 관계없이 지정한 행 수만큼 세로로 병합할 수 있습니다.',
    api: ['getCellSpan.rowSpan'],
  }),
  entry('auto-span', '자동 행 병합', {
    category: 'span',
    description: '프로젝트 컬럼에서 같은 값이 연속된 셀을 세로로 자동 병합할 수 있습니다.',
    api: ['getCellRowSpanKey'],
  }),
  entry('column-span', '열 병합', {
    category: 'span',
    description: '작업 요약 셀을 가로로 병합할 수 있습니다.',
    api: ['getCellSpan.colSpan'],
  }),
  entry('combined-span', '행·열 병합', {
    category: 'span',
    description: '프로젝트 셀의 세로 병합과 작업 요약 셀의 가로 병합을 동시에 적용할 수 있습니다.',
    api: ['getCellSpan', 'getCellRowSpanKey'],
  }),
  entry('span-scroll', '병합·가상 스크롤', {
    category: 'span',
    description: '1만 행 데이터에서 셀 병합과 가상 스크롤 동작을 확인할 수 있습니다.',
    api: ['virtualization', 'getCellRowSpanKey'],
  }),
  entry('selection', '행 선택', {
    category: 'interaction',
    description: '단일 선택과 다중 선택의 동작을 비교할 수 있습니다.',
    api: ['rowSelectionMode', 'rowSelectionModel', 'onRowSelectionModelChange'],
  }),
  entry('design-system', '외부 버튼 제어', {
    category: 'interaction',
    description: '외부 버튼으로 행을 선택·해제·삭제합니다.',
    api: ['rowSelectionModel', 'onRowSelectionModelChange', 'deleteRows'],
  }),
  entry('selection-policy', '새 행 선택', {
    category: 'interaction',
    description: '맨 위에 새 행을 추가한 뒤, 새 행의 선택 허용 여부를 설정할 수 있습니다.',
    api: ['allowSelectAll', 'defaultRowSelectionModel', 'layout.rowPanel'],
  }),
  entry('click-events', '클릭 이벤트', {
    category: 'interaction',
    description: '셀이나 행을 클릭했을 때 전달되는 이벤트 값을 확인할 수 있습니다.',
    api: ['onCellClick', 'onRowClick'],
  }),
  entry('context-menu', '컨텍스트 메뉴', {
    category: 'interaction',
    description:
      '우클릭 메뉴에서 상세 보기·수정·삭제를 실행하고 다이얼로그에서 메인 Grid를 조회할 수 있습니다.',
    api: [
      'useDataGridApi',
      'getContextMenuItems',
      'getRows',
      'getSelectedRows',
      'applyTransaction',
    ],
  }),
  entry('sorting', '다중 정렬', {
    category: 'sorting',
    description: '헤더 클릭으로 정렬 순서와 다중 정렬 우선순위를 변경할 수 있습니다.',
    api: ['sortModel', 'sortInteraction', 'maxSortColumns'],
  }),
  entry('filtering', '컬럼 필터', {
    category: 'sorting',
    description: '컬럼별 조건으로 데이터를 필터링할 수 있습니다.',
    api: ['filterModel', 'layout.filterRow'],
  }),
  entry('editing', '셀 편집', {
    category: 'editing',
    description: '셀 편집 후 Enter로 확정하거나 Esc로 취소할 수 있습니다.',
    api: ['editable', 'enterKeyAction', 'onCellValueCommit'],
  }),
  entry('save-changes', 'Mock API 저장', {
    category: 'editing',
    description: '로컬 Mock API의 저장 응답과 저장 중 추가 편집의 보존을 확인할 수 있습니다.',
    api: ['commitEditing', 'validate', 'getChanges', 'applyServerRows', 'submittedRow'],
    source: 'examples/server-save.tsx',
  }),
  entry('text-input-policy', 'Text 입력 정책', {
    category: 'editing',
    description: '정규식을 직접 적용하고, 입력 거부 안내와 검증 오류를 비교합니다.',
    api: [
      'OwpDataGridColumn.textOptions',
      'OwpDataGridTextOptions',
      'OwpDataGridTextOptions.allowedPattern',
      'OwpDataGridTextOptions.maxLength',
      'OwpDataGridTextOptions.uppercase',
      'OwpDataGridTextOptions.showRejectedInputFeedback',
      'OwpDataGridTextOptions.showRejectedInputMessage',
      'OwpDataGridTextOptions.rejectedInputMessage',
      'OwpDataGridColumn.validationMode',
      'OwpDataGridColumn.clearErrorOnInput',
      'OwpDataGridColumn.required',
      'OwpDataGridApi.commitEditing',
      'OwpDataGridApi.validate',
      'OwpDataGridApi.setCellErrors',
      'OwpDataGridApi.clearCellErrors',
      'OwpDataGridApi.hasUnsavedChanges',
      'OwpDataGridApi.getChanges',
    ],
  }),
  entry('validation', '입력 검증', {
    category: 'editing',
    description: '값 확정 시 검사와 직접 검사, 셀 수정 시 오류 처리를 비교할 수 있습니다.',
    api: [
      'required',
      'validate',
      'numberOptions',
      'validationMode',
      'clearErrorOnInput',
      'commitEditing',
      'setCellErrors',
      'clearCellErrors',
    ],
  }),
  entry('external-validation', '검증 메시지', {
    category: 'editing',
    description: '외부 검증 결과를 셀에 표시하며, 필요할 때 메시지를 삭제할 수 있습니다.',
    api: ['setCellError', 'setCellErrors', 'clearCellErrors'],
  }),
  entry('row-actions', '행 편집 툴바', {
    category: 'rows',
    description: '행 편집 툴바에서 행을 추가·삭제합니다.',
    api: ['rowEditToolbar', 'rowDeletion', 'resetChanges'],
  }),
  entry('row-insertion', '행 추가 위치', {
    category: 'rows',
    description: '맨 위·맨 아래 또는 선택 행 다음에 새 행을 추가합니다.',
    api: ['addRow', 'position', 'targetRowId'],
  }),
  entry('row-deletion', '삭제·복구', {
    category: 'rows',
    description: '기존 행 삭제·복구와 새 행 취소 동작을 비교할 수 있습니다.',
    api: ['deleteRows', 'undeleteRows', 'discardAddedRows', 'confirmDeletedRowRemoval'],
  }),
  entry('reordering', '행 이동 · 드래그', {
    category: 'rows',
    description: '행을 하나씩 드래그하거나 선택한 여러 행을 함께 이동할 수 있습니다.',
    api: ['rowReordering', 'onChangesChange'],
  }),
  entry('hook-connection', 'Hook 연결', {
    category: 'grid-api',
    description: 'hook으로 Grid API를 연결해 행을 조회하고 셀에 포커스를 맞춥니다.',
    api: ['useDataGridApi', 'OwpDataGridProps.api', 'getRows', 'focusCell'],
  }),
  entry('ref-connection', 'Ref 연결', {
    category: 'grid-api',
    description: 'ref로 같은 Grid API를 연결해 행을 조회하고 셀에 포커스를 맞춥니다.',
    api: ['OwpDataGridRef', 'getRows', 'focusCell'],
  }),
  entry('ref-data', '행 조회·일괄 처리', {
    category: 'grid-api',
    description: '전체·필터링·선택 행을 조회하고 일괄 변경할 수 있습니다.',
    api: [
      'useDataGridApi',
      'getRows',
      'getVisibleRows',
      'getSelectedRows',
      'getRow',
      'applyTransaction',
    ],
  }),
  entry('ref-focus', '셀 값·포커스', {
    category: 'grid-api',
    description: '셀 값을 변경하고 포커스·스크롤을 제어할 수 있습니다.',
    api: [
      'useDataGridApi',
      'OwpDataGridProps.api',
      'setCellValue',
      'scrollToRow',
      'focusCell',
      'commitEditing',
    ],
  }),
  entry('ref-move', '행 이동', {
    category: 'grid-api',
    description: '선택한 행을 맨 위나 맨 아래로 이동합니다.',
    api: ['useDataGridApi', 'moveRow', 'moveRows'],
  }),
  entry('ref-changes', '변경 관리', {
    category: 'grid-api',
    description: '미확정 입력·working-copy 변경을 조회하고 확정·초기화합니다.',
    api: [
      'useDataGridApi',
      'getChanges',
      'hasUnsavedChanges',
      'acceptChanges',
      'OwpDataGridResetChangesButtonApiProps.api',
      'onAfterReset',
    ],
  }),
  entry('summary-rows', '집계·고정 행', {
    category: 'aggregation',
    description: '합계·평균을 계산하고 하단 안내 행을 고정할 수 있습니다.',
    api: ['summaryRows.scope', 'summaryRows.valueGetter', 'pinnedBottomRowStyle'],
  }),
  entry('worksheet', '계산·셀 연동', {
    category: 'aggregation',
    description: '프로젝트 내·프로젝트 간 셀을 연동하고 비용을 계산할 수 있습니다.',
    api: ['valueSetter', 'onCellValueCommit', 'summaryRows'],
  }),
  entry('tree', '트리', {
    category: 'hierarchy',
    description: '하위 행의 완료율과 추세를 트리로 확인하며, 조회 방식을 변경할 수 있습니다.',
    api: ['treeOptions', 'treeOptions.lazyChildren', 'expandAll', 'rowSelectionPropagation'],
  }),
  entry('nested-tree', '다단계 트리', {
    category: 'hierarchy',
    description: '여러 단계의 하위 행을 펼치거나 접을 수 있습니다.',
    api: ['treeOptions.getChildren', 'treeOptions.expansionModel'],
  }),
  entry('tree-span', '트리·병합', {
    category: 'hierarchy',
    description: '트리 구조 안에서 같은 프로젝트 작업 셀을 병합할 수 있습니다.',
    api: ['treeOptions', 'getCellRowSpanKey'],
  }),
  entry('detail-custom', '상세 패널', {
    category: 'hierarchy',
    description: '상세 패널에 프로젝트 요약과 주간 실적을 표시할 수 있습니다.',
    api: ['detailPanel.renderDetail'],
  }),
  entry('detail-grid', '상세 그리드', {
    category: 'hierarchy',
    description: '행을 펼쳐 하위 작업과 합계 그리드를 표시할 수 있습니다.',
    api: [
      'detailPanel.loadRows',
      'detailPanel.renderDetail',
      'OwpDataGridExportExcelButtonApiProps.api',
      'scope',
    ],
  }),
  entry('overview', '표시 행 수 고정', {
    category: 'data',
    description: '화면에 표시할 행 수를 고정한 상태에서 행 선택과 합계를 확인할 수 있습니다.',
    api: ['visibleRowCount', 'rowSelectionModel', 'summaryRows'],
  }),
  entry('states', '로딩·빈 데이터·오류', {
    category: 'data',
    description: '로딩 중·데이터 없음·오류 화면을 확인하고 다시 조회할 수 있습니다.',
    api: ['loading', 'noDataMessage', 'errorOverlay'],
  }),
  entry('server-mode', 'Mock API 조회', {
    category: 'data',
    description: '로컬 Mock API에 정렬·필터 조건을 전달하고 조회 결과를 표시할 수 있습니다.',
    api: ['sortingMode', 'filteringMode'],
  }),
  entry('large-data', '대용량 데이터', {
    category: 'data',
    description: '1만~100만 행 데이터를 생성하고 가상 스크롤 동작을 확인할 수 있습니다.',
    api: ['virtualization', 'loading'],
  }),
  entry('excel', 'Excel 내보내기', {
    category: 'export',
    description: '표시·전체·선택 행을 Excel로 내보냅니다.',
    api: ['OwpDataGridExportExcelButtonApiProps.api', 'scope', 'exportName', 'excel.numFmt'],
  }),
  entry('excel-snapshot', 'Excel 내보내기 API', {
    category: 'export',
    description: '내보낼 데이터 구조와 제외 항목을 확인할 수 있습니다.',
    api: ['getExcelSnapshot', 'getExcelExportWarnings', 'createExcelExportSession'],
  }),
  entry('span-export', '병합·Excel', {
    category: 'export',
    description: '헤더와 셀 병합, 고정 합계 행을 그대로 내보냅니다.',
    api: ['getExcelSnapshot', 'pinnedBottomRows'],
  }),
] as const;

export type GridCatalogEntry = (typeof gridCatalog)[number];
export type GridExample = Extract<GridCatalogEntry, { readonly kind: 'grid' }>;
export type GridExampleId = GridExample['id'];

export const gridAliases: Readonly<Record<string, string>> = {
  minimal: 'overview',
  'visible-rows': 'overview',
  loading: 'states',
  empty: 'states',
  error: 'states',
  autocomplete: 'select',
  radius: 'overview',
  'span-selection': 'auto-span',
  'server-save': 'ref-changes',
  'lazy-tree': 'tree',
  'cell-background': 'conditional',
  'row-background': 'conditional',
  'header-sort': 'headers',
  transactions: 'ref-data',
};

export const findGridEntry = (id: string | null): GridCatalogEntry =>
  gridCatalog.find((example) => example.id === (id === null ? null : (gridAliases[id] ?? id))) ??
  gridCatalog[0];
