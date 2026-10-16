export const categories = [
  { id: 'start', label: '기본 (Basics)', title: 'Basics' },
  { id: 'columns', label: '셀·컬럼 (Cells & columns)', title: 'Cells & columns' },
  { id: 'styling', label: '스타일 (Style)', title: 'Style' },
  { id: 'span', label: '셀 병합 (Cell spanning)', title: 'Cell spanning' },
  { id: 'interaction', label: '선택·이벤트 (Selection & events)', title: 'Selection & events' },
  { id: 'sorting', label: '정렬·필터 (Sorting & filtering)', title: 'Sorting & filtering' },
  { id: 'editing', label: '편집·검증 (Editing & validation)', title: 'Editing & validation' },
  { id: 'rows', label: '행 관리 (Row management)', title: 'Row management' },
  { id: 'aggregation', label: '집계·계산 (Aggregation)', title: 'Aggregation' },
  { id: 'hierarchy', label: '트리·상세 (Tree & detail)', title: 'Tree & detail' },
  { id: 'data', label: '데이터·로딩 (Data & loading)', title: 'Data & loading' },
  { id: 'export', label: '내보내기 (Export)', title: 'Export' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];

const entry = <T extends string>(
  id: T,
  title: string,
  options: {
    readonly category: CategoryId;
    readonly description: string;
    readonly api: readonly string[];
  },
) => ({
  id,
  kind: 'grid' as const,
  title,
  package: '@owp/datagrid',
  ...options,
  source: `examples/${id}.tsx`,
});

export const sampleCatalog = [
  {
    id: 'getting-started',
    kind: 'guide',
    title: '시작',
    package: '@owp/datagrid',
    category: 'start',
    description: '',
    api: [],
    source: 'guides/getting-started.tsx',
  },
  entry('overview', '표시 행 수 고정', {
    category: 'start',
    description: '표시할 행 수를 고정하고, 행 선택과 합계를 확인합니다.',
    api: ['visibleRowCount', 'rowSelectionModel', 'summaryRows'],
  }),
  entry('cell-types', '셀 타입', {
    category: 'columns',
    description: '셀 타입별로 값을 편집합니다.',
    api: ['type', 'editable', 'autocompleteOptions'],
  }),
  entry('mixed-types', '행별 셀 타입', {
    category: 'columns',
    description: '같은 컬럼에서 행마다 다른 편집기를 사용합니다.',
    api: ['getCellType'],
  }),
  entry('select', '셀렉트', {
    category: 'columns',
    description: '셀렉트·자동완성으로 단일·다중 값을 선택합니다.',
    api: ['type', 'valueOptions', 'selectOptions.multiple', 'autocompleteOptions.multiple'],
  }),
  entry('formatting', '숫자·날짜 서식', {
    category: 'columns',
    description: '숫자와 날짜·시간 서식을 설정합니다.',
    api: ['numberOptions', 'dateOptions', 'timeOptions', 'datetimeOptions'],
  }),
  entry('renderer', '셀 컴포넌트', {
    category: 'columns',
    description: '버튼, 칩, 스위치와 진행률을 셀에 추가합니다.',
    api: ['renderCell', 'applyTransaction', 'setCellValue', 'excel'],
  }),
  entry('overflow-hint', '긴 내용 보기', {
    category: 'columns',
    description: '잘린 셀에 마우스를 올리면 전체 내용을 보여줍니다.',
    api: ['overflowHint'],
  }),
  entry('column-layout', '고정 컬럼', {
    category: 'columns',
    description: '프로젝트 컬럼을 고정하고 가로로 스크롤하는 예시입니다.',
    api: ['layout.columnRegions', 'resizable', 'relWidth'],
  }),
  entry('headers', '다단 헤더', {
    category: 'columns',
    description: '컬럼을 묶고 하위 헤더의 정렬 버튼을 설정합니다.',
    api: ['headerRows', 'hideChildHeaderSortButtons'],
  }),
  entry('conditional', '조건부 스타일', {
    category: 'styling',
    description: '셀·행 색상과 편집 제한을 설정합니다.',
    api: ['cellStyle', 'editable'],
  }),
  entry('custom-style', '커스텀 스타일', {
    category: 'styling',
    description: '스타일과 글자 크기를 바꿉니다.',
    api: [
      'sx',
      'headerRows',
      'className',
      'style',
      'cellStyle',
      'virtualization.rowHeight',
      'OwpThemeProvider',
    ],
  }),
  entry('row-span', '지정 행 병합', {
    category: 'span',
    description: '값과 관계없이 지정한 행 수만큼 셀을 병합하는 예시입니다.',
    api: ['getCellSpan.rowSpan'],
  }),
  entry('auto-span', '자동 행 병합', {
    category: 'span',
    description: '프로젝트 컬럼에서 같은 값이 연속된 셀을 자동 병합하는 예시입니다.',
    api: ['getCellRowSpanKey'],
  }),
  entry('column-span', '열 병합', {
    category: 'span',
    description: '작업 요약 셀을 가로로 병합하는 예시입니다.',
    api: ['getCellSpan.colSpan'],
  }),
  entry('combined-span', '행·열 병합', {
    category: 'span',
    description: '프로젝트의 세로 병합과 작업 요약의 가로 병합을 함께 보여주는 예시입니다.',
    api: ['getCellSpan', 'getCellRowSpanKey'],
  }),
  entry('span-scroll', '병합·가상 스크롤', {
    category: 'span',
    description: '1만 행에서 병합과 가상 스크롤을 확인합니다.',
    api: ['virtualization', 'getCellRowSpanKey'],
  }),
  entry('design-system', '외부 버튼 제어', {
    category: 'interaction',
    description: '외부 버튼으로 행을 선택·해제·삭제합니다.',
    api: ['rowSelectionModel', 'deleteRows', 'OwpThemeProvider'],
  }),
  entry('selection-policy', '새 행 선택', {
    category: 'interaction',
    description: '새 행을 상단에 추가하고 체크박스 표시를 바꿉니다.',
    api: ['allowSelectAll', 'defaultRowSelectionModel', 'layout.rowPanel'],
  }),
  entry('click-events', '클릭 이벤트', {
    category: 'interaction',
    description: '셀과 행 클릭에서 받은 값을 확인합니다.',
    api: ['onCellClick', 'onRowClick'],
  }),
  entry('context-menu', '컨텍스트 메뉴', {
    category: 'interaction',
    description: '우클릭 메뉴에서 상세 보기·수정·삭제를 실행합니다.',
    api: ['getContextMenuItems', 'applyTransaction'],
  }),
  entry('sorting', '다중 정렬', {
    category: 'sorting',
    description: '헤더를 눌러 정렬 순서와 우선순위를 바꿉니다.',
    api: ['sortModel', 'sortInteraction', 'maxSortColumns'],
  }),
  entry('filtering', '컬럼 필터', {
    category: 'sorting',
    description: '컬럼별 조건으로 목록을 좁힙니다.',
    api: ['filterModel', 'layout.filterRow'],
  }),
  entry('editing', '셀 편집', {
    category: 'editing',
    description: 'Enter로 확정하고 Esc로 취소합니다.',
    api: ['editable', 'enterKeyAction', 'onCellValueCommit'],
  }),
  entry('ref-focus', '셀 값·포커스', {
    category: 'editing',
    description: '셀 값을 바꾸고, 원하는 행과 셀로 이동합니다.',
    api: ['setCellValue', 'scrollToRow', 'focusCell', 'commitEditing'],
  }),
  entry('validation', '입력 검증', {
    category: 'editing',
    description: '필수값, 숫자 범위와 완료 수량을 검사합니다.',
    api: ['required', 'validate', 'numberOptions'],
  }),
  entry('external-validation', '검증 메시지', {
    category: 'editing',
    description: '외부에서 받은 검증 메시지를 셀에 표시하고 지웁니다.',
    api: ['setCellError', 'setCellErrors', 'clearCellError', 'clearCellErrors', 'getCellErrors'],
  }),
  entry('row-actions', '행 편집 툴바', {
    category: 'rows',
    description: '툴바에서 행을 추가·삭제합니다.',
    api: ['rowEditToolbar', 'rowDeletion', 'resetChanges'],
  }),
  entry('row-insertion', '행 추가 위치', {
    category: 'rows',
    description: '상단, 선택한 행 다음, 하단에 새 행을 추가합니다.',
    api: ['addRow', 'OwpDataGridRowPlacement'],
  }),
  entry('row-deletion', '삭제·복구', {
    category: 'rows',
    description: '선택 행은 삭제·복구, 새 행은 취소합니다.',
    api: ['deleteRows', 'undeleteRows', 'discardAddedRows', 'confirmDeletedRowRemoval'],
  }),
  entry('reordering', '행 이동 · 드래그', {
    category: 'rows',
    description: '한 행이나 선택한 행을 드래그로 옮깁니다.',
    api: ['rowReordering', 'onChangesChange'],
  }),
  entry('ref-move', '행 이동 · 버튼', {
    category: 'rows',
    description: '버튼으로 선택한 행을 맨 위나 맨 아래로 옮깁니다.',
    api: ['moveRow', 'moveRows'],
  }),
  entry('ref-data', '행 조회·일괄 처리', {
    category: 'rows',
    description: '전체·필터·선택 행을 조회하고 일괄 변경합니다.',
    api: ['getRows', 'getVisibleRows', 'getSelectedRows', 'getRow', 'applyTransaction'],
  }),
  entry('ref-changes', '변경 관리', {
    category: 'rows',
    description: '변경된 값을 확인하고, 변경을 확정하거나 되돌립니다.',
    api: ['getChanges', 'hasUnsavedChanges', 'acceptChanges', 'resetChanges'],
  }),
  entry('summary-rows', '집계·고정 행', {
    category: 'aggregation',
    description: '합계·평균을 계산하고, 하단에 안내 행을 고정합니다.',
    api: ['summaryRows.scope', 'summaryRows.valueGetter', 'pinnedBottomRowStyle'],
  }),
  entry('worksheet', '계산·셀 연동', {
    category: 'aggregation',
    description: '비용을 계산하고, 같은 프로젝트와 다른 프로젝트의 셀을 연동하는 예시입니다.',
    api: ['valueSetter', 'onCellValueCommit', 'summaryRows'],
  }),
  entry('tree', '트리', {
    category: 'hierarchy',
    description: '하위 행의 완료율과 추세를 확인하고 조회 방식을 바꿉니다.',
    api: ['treeOptions', 'treeOptions.lazyChildren', 'expandAll', 'rowSelectionPropagation'],
  }),
  entry('nested-tree', '다단계 트리', {
    category: 'hierarchy',
    description: '여러 단계의 하위 행을 펼치고 접습니다.',
    api: ['treeOptions.getChildren', 'treeOptions.expansionModel'],
  }),
  entry('tree-span', '트리·병합', {
    category: 'hierarchy',
    description: '트리 안에서 같은 프로젝트의 작업을 병합하는 예시입니다.',
    api: ['treeOptions', 'getCellRowSpanKey'],
  }),
  entry('detail-custom', '상세 패널', {
    category: 'hierarchy',
    description: '프로젝트 요약과 주간 실적을 표시하는 예시입니다.',
    api: ['detailPanel.renderDetail'],
  }),
  entry('detail-grid', '상세 그리드', {
    category: 'hierarchy',
    description: '행을 펼쳐 하위 작업과 합계를 표시합니다.',
    api: ['detailPanel.loadRows', 'detailPanel.renderDetail', 'OwpDataGridExportExcelButton'],
  }),
  entry('empty', '데이터 없음', {
    category: 'data',
    description: '빈 화면에서 로딩을 시작·종료합니다.',
    api: ['noDataMessage', 'loading'],
  }),
  entry('error', '오류·재시도', {
    category: 'data',
    description: '조회 오류를 표시하고 다시 시도합니다.',
    api: ['errorOverlay'],
  }),
  entry('server-mode', '서버 조회', {
    category: 'data',
    description: '정렬·필터 조건으로 모의 서버를 조회합니다.',
    api: ['sortingMode', 'filteringMode'],
  }),
  entry('large-data', '대용량 데이터', {
    category: 'data',
    description: '1만~100만 행을 만들고 가상 스크롤을 확인합니다.',
    api: ['virtualization', 'loading'],
  }),
  entry('excel', 'Excel 내보내기', {
    category: 'export',
    description: '표시 행, 전체 행, 선택 행을 각각 내보냅니다.',
    api: ['OwpDataGridExportExcelButton', 'excel.numFmt'],
  }),
  entry('excel-snapshot', 'Excel 내보내기 API', {
    category: 'export',
    description: '내보낼 데이터와 제외 항목을 확인합니다.',
    api: ['getExcelSnapshot', 'getExcelExportWarnings', 'createExcelExportSession'],
  }),
  entry('span-export', '병합·Excel', {
    category: 'export',
    description: '헤더와 셀 병합, 고정 합계 행을 그대로 내보냅니다.',
    api: ['getExcelSnapshot', 'pinnedBottomRows'],
  }),
] as const;

export type Sample = (typeof sampleCatalog)[number];
export type GridSample = Extract<Sample, { readonly kind: 'grid' }>;
export type SampleId = GridSample['id'];

export const sampleAliases: Readonly<Record<string, string>> = {
  minimal: 'overview',
  'visible-rows': 'overview',
  loading: 'empty',
  autocomplete: 'select',
  selection: 'overview',
  radius: 'overview',
  'span-selection': 'auto-span',
  'server-save': 'ref-changes',
  'lazy-tree': 'tree',
  'cell-background': 'conditional',
  'row-background': 'conditional',
  'header-sort': 'headers',
  transactions: 'ref-data',
};

export const findSample = (id: string | null): Sample =>
  sampleCatalog.find((sample) => sample.id === (id === null ? null : (sampleAliases[id] ?? id))) ??
  sampleCatalog[0];
