const guide = (packageId, id, title, description, api, examples, body) => ({
  id: `@owp/${packageId}:guide.${id}`,
  packageId,
  title,
  description: toReferenceStyle(description),
  api,
  examples,
  body: toReferenceStyle(body),
});

export const guides = [
  guide(
    'datagrid',
    'states',
    '조회 상태와 앱의 책임',
    '로딩·빈 데이터·오류 표시와 재시도 기준.',
    ['OwpDataGridProps.loading', 'OwpDataGridProps.noDataMessage', 'OwpDataGridProps.errorOverlay'],
    ['states', 'server-mode'],
    `loading은 조회·처리 진행 상태, noDataMessage는 빈 결과 또는 앱이 정한 선택 안내, errorOverlay는 오류 표시 설정. 오류 조건과 재시도 요청은 앱이 담당. 정상적인 빈 결과와 조회 실패를 같은 상태로 간주하지 않음.

선택에 따라 바뀌는 목록은 상위 항목을 선택하기 전 필요한 항목을 안내하고, 실제 조회 후에는 해당 조회의 로딩·결과·오류를 표시. 저장 요청 실패만으로 편집 가능한 Grid 전체를 가리지 않음.

특정 소비 앱에서 독립 조회 오류를 공통 API hook으로만 안내하는 정책은 해당 프로젝트의 정책. 패키지의 errorOverlay 지원 범위나 다른 소비 앱의 필수 정책으로 일반화하지 않음.

재조회 전에 미확정 편집과 미저장 변경의 보존 정책을 정하고, 선택한 조회에 맞는 retry만 실행. 오류 응답을 이유로 저장·삭제 요청을 자동 재전송하지 않음.`,
  ),
  guide(
    'datagrid',
    'layout-data',
    '컬럼 영역·병합·정렬·서버 데이터',
    '컬럼 영역·병합·정렬과 데이터 범위.',
    [
      'OwpDataGridProps.layout',
      'OwpDataGridProps.getCellSpan',
      'OwpDataGridProps.getCellRowSpanKey',
      'OwpDataGridProps.sortingMode',
      'OwpDataGridProps.filteringMode',
    ],
    [
      'column-layout',
      'headers',
      'combined-span',
      'sorting',
      'filtering',
      'server-mode',
      'large-data',
    ],
    `layout.columnRegions는 안정적인 column ID로 fixed·scroll 영역을 구성. headerRows는 다단 헤더와 span을 정의하고 hideChildHeaderSortButtons로 하위 헤더 정렬 UI를 선택. 컬럼 참조와 ID는 표시 위치와 분리.

getCellSpan은 client filter·sort·tree expansion 후의 body row·column을 기준으로 계산. covered cell의 callback은 호출하지 않음. span은 컬럼 영역 경계를 넘지 않도록 구성. 자동 rowSpan은 연속한 동일 key에만 적용되며 null·undefined는 병합하지 않음.

명시적 rowSpan이 있으면 자동 rowSpan보다 우선하고 colSpan만 지정하면 자동 rowSpan과 함께 사용 가능. 값이 같다는 이유로 물리 row나 저장·집계 범위를 합치지 않음.

sortModel·filterModel은 외부 제어가 가능하며 sortingMode·filteringMode의 client와 manual을 구분. manual 모드의 서버 요청과 응답 변환은 앱이 처리. displayIndex는 정렬·필터·확장으로 변하므로 업무 ID로 사용하지 않음.

대량 데이터는 기본 가상 스크롤과 높이 API를 사용. visibleRowCount는 최소 body row 수를 고정하고 부족분을 비대화형 빈 row로 채우는 별도 계약이며 loading/no-data overlay와 가상화가 비활성화됨.`,
  ),
  guide(
    'datagrid',
    'connection',
    '기본 연결과 설정 구성',
    'hook API 연결과 row ID·컬럼 설정.',
    [
      'useDataGridApi',
      'OwpDataGridProps.api',
      'OwpDataGridRef',
      'OwpDataGridProps.getRowId',
      'OwpDataGridColumn',
      'createDataGridRows',
    ],
    [
      'getting-started',
      'hook-connection',
      'ref-connection',
      'overview',
      'ref-data',
      'ref-focus',
      'context-menu',
    ],
    `컴포넌트는 @owp/datagrid, hook은 @owp/datagrid/hooks, 타입은 @owp/datagrid/types의 type-only import, 유틸리티는 @owp/datagrid/utils를 사용. 내부 src·dist 경로는 소비 앱의 import 경로가 아님.

useDataGridApi<Task>()가 반환한 gridApi를 OwpDataGrid의 api prop과 관련 버튼에 전달. 객체와 필수 메서드 reference는 유지되며 호출 시 연결된 Grid의 최신 API로 전달. 자동 상태 구독은 제공하지 않으므로 UI 갱신은 이벤트·callback이나 명시적인 state 변경으로 처리.

OwpDataGridRef는 OwpDataGridApi의 타입 alias이며 두 방식의 메서드 계약은 동일. Grid API 메뉴의 Hook 연결·Ref 연결에서 같은 행 조회·포커스를 비교 가능. 기능별 예제는 hook을 기본으로 사용. ref.current는 연결 전·해제 후 null.

하나의 API 객체는 동시에 하나의 Grid에만 연결. 상세 Grid는 별도의 hook 객체를 사용. 연결 전·해제 후 필수 메서드를 호출하면 ReferenceError가 발생하므로 Grid가 연결된 뒤 조회하고 unmount에서 요청과 다이얼로그를 정리. 같은 Grid에 api와 ref를 함께 연결 가능.

다이얼로그에 열 때 조회한 rows를 전달하면 해당 시점의 snapshot을 사용. 메인 Grid의 API 객체를 payload로 전달하면 다이얼로그 이벤트에서 getRows·getSelectedRows를 호출할 때의 값을 조회. 다이얼로그에서 새 hook 객체를 만든다고 메인 Grid를 찾지는 않음.

getRowId는 정렬·필터·편집 후에도 유지되는 ID를 반환해야 함. 화면 순서나 사용자가 바꾸는 순번을 ID로 사용하지 않음. ID 없는 조회 데이터에는 createDataGridRows를 적용하고, 같은 조회 snapshot의 ID를 렌더마다 다시 만들지 않음.

createDataGridRows는 각 row의 shallow copy를 생성. 중복 identity의 occurrence와 identity가 없는 row의 index fallback은 같은 입력 순서에서만 안정적이므로, 재정렬·재조회 후에도 같은 업무 항목을 연결해야 한다면 고유한 identity를 제공.

정적인 columns·layout·숫자 및 날짜 설정은 모듈 상수로 관리하고, 화면 상태에 의존하는 설정만 useMemo로 구성. 설정 파일은 해당 업무나 컴포넌트에서 관리. 특정 소비 앱의 업무 코드·디렉터리 이름은 패키지의 필수 계약이 아님.

field는 기본 읽기와 shallow update에 사용. 파생 표시는 valueGetter, 연관 필드 변경은 immutable한 전체 row를 반환하는 valueSetter로 처리. 원본 row나 내부 모델을 직접 수정하지 않음.`,
  ),
  guide(
    'datagrid',
    'columns',
    '셀 타입·표시·행별 옵션',
    '셀 타입·렌더러·행별 선택 후보 설정.',
    ['OwpDataGridColumn', 'OwpDataGridColumn.getCellType', 'OwpDataGridColumn.getValueOptions'],
    ['cell-types', 'mixed-types', 'renderer'],
    `기본 셀 타입은 text·number·select·date·time·datetime·boolean. 표시 우선순위는 renderCell → valueFormatter → 타입별 기본 표시. 단순 문자열 서식에는 valueFormatter를 사용하고, React 콘텐츠가 필요할 때 renderCell을 사용.

getCellType은 최신 working row를 읽는 부작용 없는 동기 callback. undefined를 반환하면 column.type, 이어서 text 기본값을 사용. 표시·편집·값 변환·검증·Excel에 적용되지만 컬럼의 정렬·필터 UI 정책은 선언된 column.type을 유지.

행별 select 후보는 getValueOptions(params)가 valueOptions보다 우선. API 조회는 앱에서 수행하고 callback은 준비된 후보를 반환. 필터 후보는 행별 후보를 자동 합치지 않으므로 filterValueOptions에 공통 후보를 지정.

Boolean은 행 선택 checkbox와 별개. 기본 저장값은 true/false이며 다른 저장 형식은 booleanOptions로 지정. false와 0은 정상 값. 미등록 값과 빈 값, required와 업무상 반드시 체크해야 하는 검증을 구분.

Context menu는 컬럼의 getContextMenuItems로 항목과 동작을 지정. 대상 셀의 현재 값과 working row를 사용하며, 항목이 없으면 기본 우클릭 동작을 유지.`,
  ),
  guide(
    'datagrid',
    'styling',
    '스타일·높이·안정적인 선택자',
    '테마·style·sx·cellStyle과 높이 설정.',
    [
      'OwpDataGridProps.sx',
      'OwpDataGridProps.style',
      'OwpDataGridColumn.cellStyle',
      'OwpDataGridProps.height',
    ],
    ['custom-style', 'overview'],
    `OwpThemeProvider의 dataGrid 설정은 여러 Grid의 기본 스타일을 지정. MUI ThemeProvider와는 별개이며 sx callback의 theme은 상위 MUI theme.

className·style·sx는 최상위 .OwpDataGrid-container에 적용. sx는 내부 기본 sx 뒤에 합성하고 배열의 뒤 항목이 같은 속성을 덮어씀. 같은 요소의 일반 sx보다 DOM inline style이 우선. column.cellStyle은 셀의 내부 sx에 합성되므로 사용자 선택자와 CSS specificity가 적용됨.

안정적인 선택자는 .OwpDataGrid-root·header·headerCell·headerLabel·row·cell·cellContent. Emotion 해시 클래스나 DOM 순서에 의존하지 않음. cellContent는 편집기도 감싸므로 표시 셀만 꾸밀 때 편집 상태를 구분.

Grid 전체 높이는 height, 가상 스크롤의 기본·최소 행 높이는 virtualization.rowHeight, 헤더 높이는 Grid 테마의 header.height를 사용. renderCell 콘텐츠의 자동 높이 측정은 유지. Portal의 popup·tooltip은 container 자손이 아니므로 루트 sx로 제어 불가.`,
  ),
  guide(
    'datagrid',
    'select',
    'Select·Autocomplete와 멀티 값',
    '선택값 저장·편집 확정·조회 표시 기준.',
    [
      'OwpDataGridColumn.selectOptions',
      'OwpDataGridColumn.autocompleteOptions',
      'OwpDataGridAutocompleteOptions.multiple',
      'OwpDataGridApi.commitEditing',
    ],
    ['select', 'overflow-hint'],
    `일반 select는 검색 입력 없는 메뉴이고 autocompleteOptions는 검색 가능한 편집기를 선택. autocompleteOptions가 있으면 해당 multiple 설정이 selectOptions보다 우선. 단일 선택은 option value의 string/number identity를 유지.

멀티 선택의 저장값·draft·valueSetter.nextValue·onCellValueCommit의 value는 선택 순서의 콤마 구분 문자열. 새 option value는 콤마 없는 비어 있지 않은 문자열이어야 하고, 빈 선택은 빈 문자열. 기존 unknown·disabled 값은 임의로 지우지 않음.

일반 멀티 메뉴의 선택·해제는 draft와 메뉴를 유지. 메뉴 밖 Enter·Tab·외부 blur로 확정하고 Escape로 취소. 자동완성 목록이 열린 Enter는 highlight 항목을 선택하고 닫으며 다음 Enter가 draft를 확정. 자유 입력을 저장하지 않음.

편집 중에는 개별 칩과 +N 요약을 표시. 조회 시에는 전체 label을 연결하되 폭이 부족하면 앞 항목과 생략 개수를 표시. overflowHint를 끄지 않았다면 긴 텍스트 힌트로 전체 label 확인 가능. 복사·Excel에는 +N 요약을 저장하지 않음.

후보에 없는 값은 validate의 column 오류로 검사하고 외부 오류는 명시적으로 해제. 저장·Excel에 미확정 draft까지 포함하려면 commitEditing 성공 후 필요한 검증을 진행.`,
  ),
  guide(
    'datagrid',
    'selection',
    '선택·병합·초기화 상태',
    '선택 그룹과 실제 row 범위.',
    [
      'OwpDataGridProps.rowSelectionModel',
      'OwpDataGridProps.rowSelectionScope',
      'OwpDataGridProps.rowSelectionPropagation',
      'OwpDataGridResetChangesButtonApiProps.onAfterReset',
    ],
    ['selection', 'selection-policy', 'auto-span'],
    `rowSelectionMode의 기본값은 none. 외부 제어는 rowSelectionModel·onRowSelectionModelChange, 초기값은 defaultRowSelectionModel을 사용. allowSelectAll은 헤더 전체 선택만 제어. 신규행 선택은 rowPanel.allowAddedRowSelection으로 별도 허용.

rowSelectionScope의 panelRowSpan은 안정적인 columnId의 span 그룹을 논리적 선택 단위로 사용. 선택 모델에는 anchor ID가 남고 getSelectedRows와 선택 삭제는 그룹의 실제 row 전체를 대상으로 함. deleteRows(rowIds) 같은 직접 명령은 전달한 ID만 처리.

Tree의 loaded 부모·자식 전파는 rowSelectionPropagation으로 지정. 정렬·필터·확장 후의 표시 순서와 span으로 그룹을 계산. 필터 변경 시 외부 선택을 해제할지는 앱이 결정.

resetChanges는 Grid의 마지막 승인 baseline을 복원. 앱이 보관하는 선택 ID·선택 row·하위 조회 상태까지 모두 초기화하지는 않음. 공용 초기화 버튼은 api 또는 dataGridRef 중 하나만 전달. api 방식의 onAfterReset은 { api }, ref 방식은 { dataGridRef } context를 받으며 필요한 앱 상태를 여기서 정리. 직접 resetChanges 호출 경로는 별도로 처리.`,
  ),
  guide(
    'datagrid',
    'editing',
    '편집·키보드·검증',
    '편집 확정·검증·외부 오류 처리.',
    [
      'OwpDataGridProps.enterKeyAction',
      'OwpDataGridApi.commitEditing',
      'OwpDataGridApi.hasUnsavedChanges',
      'OwpDataGridApi.getChanges',
      'OwpDataGridApi.validate',
      'OwpDataGridApi.setCellErrors',
    ],
    ['editing', 'validation', 'external-validation'],
    `editable은 셀 편집 허용 여부를 지정. 기본 편집기·IME·확정·취소 동작을 DOM 이벤트나 앱 전용 편집기로 중복 구현하지 않음. 연관 필드 변경은 순수하고 immutable한 valueSetter에서 처리.

현재 공개 API의 enterKeyAction 기본값은 nextEditableCell. Enter 확정 후 다음 편집 가능 셀로 이동하며 stay는 현재 셀을 유지. Tab/Shift+Tab은 editable 여부와 관계없이 다음/이전 body cell로 이동. 이전 소비 앱 스킬의 'Enter는 항상 현재 셀 유지' 설명은 현재 기본 계약에 적용하지 않음.

hasUnsavedChanges는 working-copy 변경과 미확정 draft를 함께 감지. getChanges는 working-copy에 반영된 변경만 반환하므로 입력·취소·확정 시 두 결과가 다를 수 있음.

commitEditing의 true는 최신 draft 확정 성공이며 업무 검증 성공을 뜻하지 않음. 저장 전 commitEditing 성공 → validate → getChanges 순서로 실행하고, 검증 실패 시 반환된 rowId·columnId로 focusCell을 호출. rowIds·columnIds로 검증 범위 제한 가능.

검증 출처는 required·column·external. setCellErrors는 외부 오류 집합을 원자적으로 교체. 같은 셀의 외부 오류는 우선 표시되고 편집만으로 자동 삭제되지 않음. 재검증으로 해소가 확인되면 clearCellError(s)를 호출. 네트워크 장애처럼 셀과 무관한 실패는 셀 오류로 만들지 않음.`,
  ),
  guide(
    'datagrid',
    'saving',
    '일괄 변경·부분 저장·저장 후 재편집',
    '변경 조회·서버 저장·저장 결과 반영 순서.',
    [
      'OwpDataGridApi.applyTransaction',
      'OwpDataGridApi.applyServerRows',
      'OwpDataGridApi.acceptChanges',
      'OwpDataGridServerRow.submittedRow',
    ],
    ['save-changes', 'ref-changes'],
    `저장 흐름은 commitEditing → validate → 실제 전송 row의 immutable snapshot 확보 → HTTP 요청 → 성공한 범위의 로컬 반영. confirm 대기 중 편집이 가능했다면 확정·검증과 대상을 다시 확인.

applyTransaction은 add·setCellValue·delete를 순서대로 평가하고 하나라도 실패하면 전체 로컬 변경을 반영하지 않음. HTTP나 서버 DB transaction을 수행하지 않음. 성공해도 validation 오류가 있을 수 있음.

applyServerRows의 rows에는 rowId·서버의 전체 row·요청 당시 전체 submittedRow를 전달. 요청 후 수정한 필드는 보존하고 나머지는 서버 값으로 반영. 일부 필드 patch나 ID 재매핑 API가 아님. 응답 순서와 요청 일치는 앱이 검사.

acceptChanges는 지정 row의 현재 값과 순서를 저장 기준으로 승인. ID 생략은 loaded row 전체, 빈 배열은 no-op. 부분 저장에서는 성공한 ID만 사용하고 요청 뒤 추가 편집까지 승인하지 않음. applyServerRows는 기존 row의 이동 순서를 승인하지 않음.

명령 결과의 success·reason·operationIndex를 확인. editing-active이면 편집을 먼저 확정. 서버 저장은 성공했지만 로컬 반영이 실패한 경우 성공 응답과 snapshot을 보존한 뒤 로컬 반영만 다시 처리.

discardAddedRows는 지정 신규행만 취소. soft-delete·전체 reset·저장 승인과 다름. Tree의 부모 취소에는 loaded 자식 범위도 명시해야 하며 다른 미저장 변경은 유지.`,
  ),
  guide(
    'datagrid',
    'rows',
    '행 이동·삭제와 순서 저장',
    '행 ID·표시 순서·저장 순번 관리.',
    [
      'OwpDataGridProps.rowReordering',
      'OwpDataGridApi.moveRows',
      'createDataGridSequenceUpdatePlan',
      'OwpDataGridProps.rowDeletion',
    ],
    ['reordering', 'row-actions'],
    `rowReordering은 기본 비활성이고 dragMode 기본값은 single. selected는 정규화한 선택 root row를 한 block으로 이동. 대화형 요소의 조작은 drag를 시작하지 않음. 정렬·필터 중 built-in 이동은 비활성화됨.

이동 후 callback에서는 이미 갱신된 getRows의 topology를 읽음. createDataGridSequenceUpdatePlan은 밀려난 row를 포함한 변경 순번과 전체 orderedRowIds를 제공. row ID와 편집 가능한 sequence는 별개.

순서 저장은 앱의 업무 API가 처리. 실제 저장한 영향 범위와 현재 값·위치가 일치할 때만 acceptChanges로 승인. 순서만 저장했는데 다른 미저장 값까지 함께 승인하지 않음.

rowDeletion은 soft-delete와 복원을 제공. 삭제 표시된 신규행은 CREATE/UPDATE 변경 목록에서 제외되고 복원하면 added로 돌아옴. 두 번째 삭제 action의 영구 제거 확인 여부는 confirmDeletedRowRemoval로 설정. 서버 삭제가 필요한 기존행은 soft-delete의 deleted 변경을 저장 대상으로 사용.`,
  ),
  guide(
    'datagrid',
    'tree-detail',
    'Tree와 Master-detail',
    '트리·상세 패널의 조회·확장·취소.',
    [
      'OwpDataGridProps.treeOptions',
      'OwpDataGridDetailPanelOptions',
      'OwpDataGridApi.loadChildren',
    ],
    ['tree', 'nested-tree', 'detail-grid', 'detail-custom'],
    `Tree는 nested의 getChildren 또는 parent-reference의 getParentRowId로 구성하고 안정적인 getRowId를 지정. expansionModel로 외부 확장을 제어하고 lazyChildren의 signal을 비동기 조회에 연결. 표시 index를 부모 관계의 기준으로 사용하지 않음.

detailPanel은 부모 행 안의 상세 콘텐츠이며 별도 상하위 Grid 선택 흐름과 구분. 기본 높이는 280px. 중첩 Grid는 gridProps와 getRows 또는 loadRows로 구성. rows·height·loading·errorOverlay·detailPanel은 부모가 관리하므로 gridProps에 중복 지정하지 않음.

커스텀 테이블·차트는 renderDetail을 사용하고 gridProps를 함께 지정하지 않음. 자체적으로 조회한다면 getRows·loadRows 생략 가능. 공개 타입의 분기 계약을 확인.

상세 조회는 패널이 보일 때 시작하고 같은 부모 행의 결과를 재사용. 접기·행 제거·언마운트 시 signal로 취소하고 error·retry를 연결. row 객체와 설정 참조를 불필요하게 교체해 반복 조회하지 않음.`,
  ),
  guide(
    'datagrid',
    'formatting',
    '숫자·날짜·시간과 Excel',
    '숫자·날짜 서식과 Excel 값 변환.',
    [
      'OwpDataGridNumberOptions',
      'OwpDataGridDateOptions',
      'OwpDataGridTimeOptions',
      'OwpDataGridDatetimeOptions',
      'OwpDataGridExcelColumnOptions',
    ],
    ['formatting', 'excel', 'summary-rows'],
    `숫자의 기본 서식은 numberOptions로 지정. 소수 자릿수·grouping과 min·max·allowNegative를 구분. 0은 정상 값이고 빈 값의 필수 여부는 required로 검사. 범위 밖 값을 자동 clamp하지 않으며 명령 성공 후에도 validate가 필요.

dateOptions는 YYYY·YYYY-MM·YYYY-MM-DD 정밀도를 지원. strict는 지정 형식의 문자열만 해석하고 common은 모호하지 않고 유효한 일반 입력만 정규화. 월·일 두 해석이 가능한 값과 잘못된 날짜는 추측해 보정하지 않음.

timeOptions는 HH:mm·HH:mm:ss, datetimeOptions는 YYYY-MM-DD HH:mm[:ss]를 사용. useAmPm은 picker 표시만 바꾸며 저장 문자열은 24시간제. 시간대 없는 datetime 문자열과 Z·offset 입력을 구분하고 후자는 업무 경계에서 명시적으로 변환.

조회와 변경 없는 편집은 원본 값 표현을 보존. 실제 편집값만 설정 형식으로 확정하고 sort·filter는 정밀도를 따름. 표시용 valueFormatter가 파싱·정렬 계약까지 바꾸지는 않음.

Excel은 Grid와 공개 다운로드 버튼에 같은 api 객체를 전달. 기존 dataGridRef 방식도 지원하지만 버튼 하나에 두 source를 함께 전달할 수 없음. 기본 scope는 visible이며 all·selected를 지원. 숫자 타입은 가능한 값을 number로 내보내고 numberOptions로 기본 numFmt를 구성. 명시한 excel.numFmt와 excel.valueGetter는 해당 기본값보다 우선. 날짜·시간은 표시 형식의 문자열을 사용.

summaryRows는 실제 rows와 분리된 고정 집계행. filtered/all은 loaded active row 범위이며 서버 전체 집계가 아님. Excel은 실제 export 범위로 다시 집계하고 includeSummaryRows로 포함 여부를 지정. Span은 각 내보내기 범위에서 다시 계산.`,
  ),
  guide(
    'charts',
    'composition',
    '차트 구성과 옵션 우선순위',
    '차트 구성과 native 옵션 사용.',
    [
      'ChartFrameProps',
      'CoreChartProps',
      'mergeChartOptions',
      'registerChartTime',
      'ChartTimeValue',
      'ChartTimePoint',
      'ChartTimeAdapterOptions',
    ],
    ['getting-started', 'bar', 'line'],
    `기본 Bar·Line·복합 차트는 ChartFrame으로 구성하고 Area·Radar·Radial·Box plot·Treemap·Heatmap·Live는 전용 컴포넌트의 데이터 계약을 사용. 필요한 Chart.js 등록은 패키지가 처리.

옵션 우선순위는 기본값 → 유형별 props → 명시한 native options. 개별 datasetOptions는 해당 dataset 범위에 적용. false·0은 보존하고 undefined로 기존 설정을 지우지 않으며 배열은 교체. 호출자가 전달한 입력 객체를 수정하지 않음.

preset="owp"는 공통 테마·HTML tooltip·interaction 기본값을 제공. 일반 애니메이션 비활성 기본값과 예제에서 의도한 전환 설정을 구분. Custom options·plugins·chartRef 확장을 유지.

시간축은 native options.scales에서 time·timeseries를 선택한다. time은 실제 시간 차이에 비례해 배치하고 timeseries는 관측 시점을 같은 간격으로 배치한다. Core는 TimeScale·TimeSeriesScale을 등록하며 date adapter는 앱에서 준비한다. Luxon을 선택하면 optional peer인 luxon 3.x와 chartjs-adapter-luxon 1.3.1 이상을 설치하고 첫 chart mount 전에 @owp/charts/chartjs/time의 registerChartTime()을 await한다. 함수는 Promise<void>를 반환하며 동시 호출은 같은 Promise를 공유하고 실패하면 다음 호출에서 재시도한다. 앱 bootstrap에서 실패를 처리한 뒤 준비된 chart를 mount한다. 다른 adapter를 이미 쓰는 앱은 기존 초기화를 유지하고 helper를 호출하지 않는다. Luxon을 불러오면 동일 Chart.js instance의 전역 date adapter가 교체된다.

현재 Playground에 Luxon 3.x와 chartjs-adapter-luxon 1.3.1 설치됨. time-line·time-combo·time-max-span 예제는 TimeChart에서 초기화를 기다린 뒤 mount하며, 초기화 실패 시 다시 시도할 수 있다. 기존 date-time·time-series는 category 축을 유지한다. 시간축을 사용하는 앱은 패키지의 scale 지원과 별도로 adapter를 준비해야 한다. registerChartTime은 root·/chartjs·/chartjs/register에서 re-export하지 않는다. ChartTimeValue는 number | string | Date, ChartTimePoint<TX extends ChartTimeValue = number>는 { x: TX; y: number | null }이다. ChartTimeAdapterOptions는 zone·locale 등 date adapter 옵션을 담는 공개 구조 타입이다. 이 타입은 /types 또는 /chartjs/types에서 type-only로 import한다. 숫자 X·경계는 epoch millisecond이며 초 단위를 자동 변환하지 않는다. parsing: false는 유한한 epoch millisecond X가 각 dataset에서 오름차순인 경우에만 사용한다. String·Date·custom parser는 native parsing을 켠다. normalized: true는 모든 dataset의 X index가 고유하고 정렬되어 서로 일치할 때만 사용한다. Offset 없는 날짜 문자열은 adapter의 zone 기본값인 local에 따라 해석되므로 같은 시점이 필요하면 offset이나 zone을 명시한다.

로그축은 options.scales의 type: 'logarithmic'을 사용하며 Core가 LogarithmicScale을 자동 등록한다. Native parsing은 양수만 로그 값으로 사용하고 0·음수·null은 native 규칙에 따라 제외되거나 gap으로 표시. parsing: false에서는 caller가 축에 맞게 정렬한 양수 numeric point를 준비한다. Native zoom·reset은 지원하지만 로그축을 대상으로 하는 OWP zoomSlider 슬롯은 RangeError를 발생시킨다. Category X축 slider와 로그 Y축은 함께 사용할 수 있다.

Subtitle은 자동 등록되며 options.plugins.subtitle로 설정한다. 기본값은 display: false이고 text는 문자열 또는 여러 줄의 문자열 배열이다. Frame의 title은 main title로 유지한다. 부제목은 native canvas에 그려져 PNG export에 포함된다. Canvas 부제목은 접근성 이름에 자동 추가되지 않으므로 필요한 설명은 aria-label로 전달한다.

API 응답 필드·DTO 변환·조회·polling·버튼과 화면 높이는 앱이 담당. 패키지는 차트 구성·공통 표시·상태·상호작용과 렌더링을 담당.`,
  ),
  guide(
    'charts',
    'identity',
    'Series ID·범례·표시 상태',
    '데이터 ID·라벨 구분과 상태 연결.',
    ['ChartSeriesConfig.id', 'ChartFrameProps.visibility', 'ChartLegendOptions'],
    ['legend', 'doughnut'],
    `createChartData의 명시적 series.id는 label·dataKey와 독립적이며 datasetOptions.id보다 우선. 같은 dataKey의 여러 series에는 서로 다른 고정 ID를 부여하고 datasetIdKey="id"를 사용.

visibility를 전달하면 외부 제어값이 우선하고 범례는 변경 요청을 보냄. dataset.hidden은 별도 표시 gate. 데이터 객체 교체·label 번역·재정렬로 사용자의 수동 숨김을 잃지 않도록 ID를 유지.

원형 차트의 ring과 항목 상태는 별개. legend.mode의 auto·series·items·both를 사용하며 화면과 PNG의 제목·formatter·숨김 상태가 같은 의미를 갖도록 구성.

legend.animation은 범례 표시 전환을 제어. 데이터 갱신 애니메이션과 구분하고 빠른 재클릭·reduced motion·숨겨진 탭·Live pause 상태를 함께 고려.`,
  ),
  guide(
    'charts',
    'zoom',
    '축·Zoom·차트 동기화',
    '축 범위와 화면 확대 범위 설정.',
    [
      'ChartFrameProps.zoomSlider',
      'ChartFrameProps.interactionLayer',
      'ChartFrameProps.linkedInteraction',
      'ChartZoomSliderAxisOptions',
    ],
    ['x-slider', 'y-sliders', 'drag-zoom', 'wheel-pinch', 'linked'],
    `zoomSlider는 x·y·y1·y2 슬롯에 축 범위를 연결. 축의 scaleId·초기 start/end·min/max와 표시 위치를 구분. 드래그·휠·pinch는 interactionLayer.dragZoom 설정을 사용.

time·timeseries 축의 zoom·slider 경계와 step은 millisecond 단위다. 원하는 이동 간격은 step으로 지정한다. 시간축 선택만으로 자동 이동 창이 생기지 않으며 OwpLiveChart의 기본 linear 이동 창과 수신·보관 계약은 별개다. logarithmic 축은 native zoom·reset을 지원하지만 이를 대상으로 하는 OWP zoomSlider 슬롯은 scale ID가 포함된 RangeError를 발생시킨다. Category X축 slider와 로그 Y축의 조합은 사용할 수 있다.

패키지는 원본 축 설정과 runtime viewport를 구분해 같은 설정의 새 data/options에서도 zoom을 보존. 실제 native min/max·slider 초기값 변경, domain 축소와 reset은 현재 설정에 맞춰 반영. 앱에서 강제 remount나 수동 min/max 복원으로 중복 처리하지 않음.

linkedInteraction의 group과 syncBy로 포인터 매칭 기준을 지정하고 syncCrosshair·syncTooltip·syncZoom을 선택. label 기반 category zoom은 공통 label 범위를 사용하고 공통 범위가 없으면 유지.

축의 범위·격자·눈금·제목은 native options.scales의 해당 scale ID에 설정. OWP의 yAxisId는 데이터 factory 설정이고 native dataset.yAxisID와 철자가 다른 계약.`,
  ),
  guide(
    'charts',
    'states',
    'Loading·빈 데이터·오류와 접근성',
    '로딩·빈 데이터·오류 표시 기준.',
    [
      'ChartFrameProps.loading',
      'ChartFrameProps.noData',
      'ChartFrameProps.errorOverlay',
      'ChartZoomSliderAxisOptions.ariaLabel',
    ],
    ['states', 'doughnut', 'y-sliders'],
    `공통 상태 표시 우선순위는 loading → errorOverlay → noData. 조회와 상태 전환, retry의 실제 요청은 앱이 담당. onRetry가 없으면 재시도 동작을 만들지 않음.

noData는 호출자가 명시. 빈 배열·null gap·모든 series 숨김·합계 0은 서로 다른 상태. 원형의 emptyState는 일반 조회 결과 없음과 구분하는 시각 표현.

Slider의 이름은 ariaLabel, 날짜·백분율 등 값의 의미는 valueTextFormatter로 지정. 여러 Y축은 명시한 scale 이름과 ID를 사용. DOM 순서나 MutationObserver로 접근성 속성을 보정하지 않음.

범례의 키보드 포커스와 aria-pressed, zoom 초기화·retry 후의 포커스 이동은 패키지의 기본 동작을 유지. 모든 버튼의 tabIndex를 일괄 덮어쓰지 않음.`,
  ),
  guide(
    'charts',
    'tooltip-plugins',
    'Tooltip·라벨·Plugin 확장',
    'tooltip·callback·plugin 설정.',
    [
      'ChartFrameProps.externalTooltip',
      'ChartFrameExternalTooltipOptions',
      'ChartDataLabelsPluginOptions',
      'ChartAnnotationPluginOptions',
      'ChartTrendlineLinearOptions',
    ],
    ['external-tooltip', 'tooltip-content', 'data-labels', 'trendline'],
    `externalTooltip은 canvas 밖에도 표시할 수 있는 HTML tooltip. maxHeight·viewportPadding으로 읽기 가능한 영역을 제한하고 callbacks로 제목·본문·footer를 구성. 외부 callback은 기존 callback과 함께 실행하는 관찰 경로와 표시 대체 경로를 구분.

datalabels는 options.plugins.datalabels 또는 dataset.datalabels, trendline은 dataset.trendlineLinear·trendlineExponential 설정으로 활성화하는 chart-local optional plugin. 소비 앱에서 전역 Chart.register를 중복 호출하지 않음.

사용자 plugins 순서를 보존하고 frozen/shared 배열을 수정하지 않음. 필수 내부 plugin ID 충돌은 오류이며 제거·재활성화 시 listener와 등록 상태를 정리.

Bar 내부 값 라벨은 createBarSegmentLabels를 사용. 실제 geometry·텍스트 크기·padding에 따라 가로/세로/숨김을 결정하고 mixed Line·0·비숫자는 숨김. Annotation은 선·박스 등 실제 지원 타입의 공개 설정을 사용.`,
  ),
  guide(
    'charts',
    'live',
    'Live 데이터·이동 창·Lifecycle',
    '실시간 데이터 수신·갱신·보관 기준.',
    ['OwpLiveChartProps', 'OwpLiveChartHandle', 'LiveSeries', 'LiveAppend'],
    ['live'],
    `앱의 수신 주기와 패키지의 화면 transition을 분리. 데이터·X축 범위·눈금은 같은 이동 창을 사용하며 앱에서 매 frame 차트 instance를 직접 수정하지 않음.

snapshot과 append 입력 계약을 구분하고 안정적인 series ID를 유지. append는 전체 입력을 검증한 뒤 원자적으로 반영. 첫 snapshot은 실제 timestamp 범위에 즉시 표시하며 이후 입력은 현재 화면 위치에서 새 목표로 이어짐.

window의 범위·transition·tickSpacing·maxTicks·axisLayout을 사용. Epoch와 일반 숫자 X, 불규칙 입력, domain 변경과 resize에서 눈금·축 라벨의 공간을 함께 고려. 임의 formatter의 최대 폭은 자동 보장하지 않으므로 필요한 공간을 공개 layout 설정으로 예약.

pause의 이동 정지와 범례 조작은 구분. 숨겨진 탭·reduced motion·unmount에서 불필요한 frame을 예약하지 않고 재개 시 최신 목표를 적용. 앱의 polling·구독도 자체 cleanup으로 정리.`,
  ),
  guide(
    'charts',
    'area-radial',
    'Area·Radar·원형 차트',
    'Area·Radar·원형 차트의 입력·표시 기준.',
    ['OwpAreaChartProps', 'OwpRadarChartProps', 'OwpRadialChartProps', 'AreaSeries', 'RadialItem'],
    ['area', 'radar', 'doughnut'],
    `Area는 labels와 ID 있는 series를 사용하고 null을 gap으로 유지. baseline·above·below와 stacked를 지정할 수 있으며 datasetOptions로 native Line 설정을 전달. 직접 계산한 fill 색상의 alpha를 다시 적용하지 않음.

Radar는 같은 지표 축에 series를 비교. labels·labelOptions와 native radial scale 설정으로 범위·격자·긴 라벨을 구성. Native geometry와 hit test를 그대로 사용.

Radial은 variant·rings·items의 실제 공개 입력을 사용. 항목 ID와 label을 구분하고 ring별 항목 표시를 독립적으로 유지. 비율 분모·null·0·음수의 처리 정책은 해당 타입과 옵션을 확인.

semiCircle·rotation·cutout과 outsideLabels는 전용 props. 좁은 화면에서 바깥 라벨을 생략해도 범례·tooltip에서 항목과 값을 확인할 수 있게 구성. emptyState와 업무상 noData를 구분.`,
  ),
  guide(
    'charts',
    'geometry',
    'Box plot·Treemap·Heatmap',
    'Box plot·Treemap·Heatmap의 데이터·표시 설정.',
    [
      'OwpBoxPlotChartProps',
      'BoxPlotDatasetOptions',
      'OwpTreemapChartProps',
      'OwpHeatmapChartProps',
      'summarizeBox',
      'TreemapAccessors',
    ],
    ['box-plot', 'treemap', 'heatmap'],
    `Box plot은 요약 통계와 원자료의 입력 계약을 구분. summarizeBox·resolveBoxStatistics의 사분위수·수염·이상치 정책을 사용하고 빈 입력·null·비유한수 처리는 공개 옵션을 확인.

설치된 @owp/charts 5.0.1의 native 타입명은 boxPlot·treemap·heatmap. CoreChart·ChartFrame의 type으로 직접 지정할 수 있으며 필요한 controller는 자동 등록. Chart.js instance를 직접 생성할 때는 @owp/charts/chartjs/register의 registerChartCore()를 먼저 호출.

전용 OwpBoxPlotChart·OwpTreemapChart·OwpHeatmapChart도 같은 native 타입을 사용. 5.0.0에서는 이전 owpBoxPlot·owpTreemap·owpHeatmap 타입명이 제거됨. ChartData·ChartOptions·ChartDataset·ScriptableContext·TooltipItem·chartRef와 options.datasets key를 해당 native 타입으로 맞춤.

별도 dataset 옵션은 BoxPlotDatasetOptions<'boxPlot'>·TreemapDatasetOptions<'treemap'>·HeatmapDatasetOptions<'heatmap'>를 사용하며 generic을 생략해도 같은 native 타입이 기본값. createBoxPlotTooltipCallbacks(labels)는 boxPlot callback을 반환하며 type generic을 받지 않음.

Treemap의 data는 항목 ID·값·그룹을 가진 데이터이며 formatter와 style로 표시를 조정. TreemapDatum 형태는 기본 accessor를 사용하고 다른 row 타입은 accessors 지정 필요. 현재 실행 예제는 기본 입력과 data·style·formatter를 사용. 면적 layout과 hit test는 패키지가 함께 처리.

Heatmap은 x·y와 value를 가진 점 및 축 항목을 사용. domain·colors·valueLabels로 색상 범위와 값을 표시. 0과 null을 구분하고 중복 좌표 집계는 createHeatmapData의 aggregation 계약을 사용.

각 전용 차트의 options·plugins·chartRef·공통 상태 지원 범위는 실제 공개 props의 확장 타입을 확인. 다른 유형의 입력 구조를 이름만 바꿔 전달하지 않음.`,
  ),
  guide(
    'charts',
    'utilities',
    '데이터·집계·Palette 유틸리티',
    '공통 유틸리티와 앱의 데이터 처리 범위.',
    [
      'createChartData',
      'createHistogram',
      'createPareto',
      'downsampleMinMax',
      'useChartPalette',
      'createChartColors',
    ],
    ['histogram', 'pareto', 'sparkline'],
    `createChartData는 categoryKey·series.dataKey로 입력을 구성. API 문자열을 숫자로 변환하는 업무 전처리는 앱에서 명시하고 null gap을 유지.

createHistogram은 숫자 경계와 빈도를 반환하고 locale·자릿수·구간 문자열은 호출자 formatter에서 지정. createPareto는 정렬된 원본 item과 누적 합계·0~1 비율을 반환하며 기준선 UI는 앱에서 구성.

downsampleMinMax는 원본 객체·순서·양끝점·bucket 극값과 개수 상한을 보존. Native decimation과 지원 조건·출력 범위가 같다고 가정하지 않음. Sparkline은 CoreChart 조합을 우선 사용.

useChartPalette·createChartColors는 mode·surface·minContrast로 기본 색상을 구성. 명시한 colors는 자동 보정하지 않고 실제 panel 배경이 theme paper와 다르면 surface를 전달. CSS 변수·미지원 색상·투명 surface fallback은 대비 검증 보장이 아님.`,
  ),
  guide(
    'charts',
    'export-layout',
    'PNG 내보내기·반응형·성능',
    'PNG 내보내기·레이아웃·대량 데이터 처리.',
    ['ChartFrameProps.exportRef', 'ChartFrameExportHandle', 'CoreChartProps.height'],
    ['png-export', 'small-multiples'],
    `exportRef는 차트와 범례를 PNG base64·Blob·data URL로 반환하거나 다운로드. 파일명·pixelRatio·배경 등은 공개 export 옵션을 사용. 업무 버튼과 다운로드 시점은 앱이 담당.

options.plugins.subtitle의 부제목은 native canvas와 함께 PNG에 포함된다. 상단 부제목의 layout 높이는 zoom reset 버튼 위치에 반영된다. 부제목의 여러 줄 표시는 text 배열로 지정하고 번역과 aria-label의 접근성 설명은 앱에서 준비한다.

height="100%"를 사용할 때는 부모 영역의 높이를 지정. Tailwind가 없는 프로젝트는 시작 가이드의 chart-layout.css를 함께 적용. 좁은 영역에서는 min-width·overflow와 긴 label을 확인. 특정 소비 앱의 breakpoint·panel class는 앱 정책.

대량 데이터의 전처리는 변경 시점에 수행하고 tooltip·draw·resize 경로의 불필요한 배열·객체 생성을 줄임. 숨겨진 페이지의 polling과 frame 작업은 정리. 계산 테스트 통과와 실제 브라우저의 FPS·메모리 측정 결과를 구분.

기존 예제는 실제 실행하는 TSX와 의존 파일을 소스로 제공. 설명용 코드 사본을 별도로 유지하지 않고 관련 예제의 코드·데이터·이벤트를 함께 확인.`,
  ),
];
import { toReferenceStyle } from './korean-copy.mjs';
