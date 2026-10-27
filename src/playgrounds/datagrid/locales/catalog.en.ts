export const catalogEnglish: Readonly<Record<string, string>> = {
  '작성한 정규식은 정규식 적용 버튼을 눌러야 Grid에 반영됩니다.':
    'Choose Apply pattern to update the Grid with the draft pattern.',
  '빈 정규식은 문자 제한을 두지 않습니다.': 'An empty pattern leaves characters unrestricted.',
  '정규식 형식이 올바르지 않습니다.': 'The regular expression syntax is invalid.',
  '데이터 상태': 'Data state',
  '편집 제한': 'Editing restrictions',
  '정규식을 적용했습니다.': 'The regular expression was applied.',
  '정규식 제한을 해제했습니다.': 'The regular expression restriction was removed.',
  '정규식을 직접 적용하고, 입력 거부 안내와 검증 오류를 비교합니다.':
    'Apply your own regular expression and compare rejection feedback with validation errors.',
  '직접 설정한 정규식': 'Custom regular expression',
  '입력 안내·오류 비교': 'Input feedback and errors',
  '입력 거부 안내': 'Rejection feedback',
  '입력 거부 안내와 검증 오류의 표시 방식을 비교합니다.':
    'Compare how input rejection feedback and validation errors are displayed.',
  '테스트 규칙: Y/N 한 글자 · 소문자는 대문자로 변환':
    'Test rule: one Y/N character · lowercase becomes uppercase',
  '영문·숫자 코드': 'Alphanumeric code',
  '기본 안내': 'Default feedback',
  정규식: 'Regular expression',
  '정규식 형식을 확인해 주세요.': 'Check the regular expression syntax.',
  '문법이 올바릅니다. 일치 여부는 별도로 확인해 주세요.':
    'The syntax is valid. Check matching separately.',
  '정규식 적용': 'Apply pattern',
  '현재 정규식이 적용되어 있습니다.': 'The current pattern is applied.',
  '작성한 정규식이 아직 적용되지 않았습니다.': 'The draft pattern has not been applied.',
  '적용된 정규식: {{pattern}}': 'Applied pattern: {{pattern}}',
  '문자 제한 없음': 'No character restriction',
  '작성한 정규식 테스트': 'Test the draft pattern',
  '테스트할 값': 'Value to test',
  '일치 확인': 'Check match',
  '일치 확인은 작성 중인 정규식으로 값 전체를 검사합니다.':
    'Matching checks the entire value against the draft pattern.',
  '빈 값은 입력 정책에서 허용합니다. 필수 입력은 별도로 검사합니다.':
    'The input policy allows an empty value. Required values are validated separately.',
  '값 전체가 일치합니다.': 'The entire value matches.',
  '값 전체가 일치하지 않습니다.': 'The entire value does not match.',
  '빈 값이나 공백만 입력하면 기본 안내 문구를 사용합니다.':
    'An empty or whitespace-only message uses the default feedback message.',
  '소문자는 대문자로 바꾸며 영문과 숫자만 허용합니다.':
    'Lowercase letters become uppercase; only letters and digits are allowed.',
  '이 컬럼은 기본 거부 안내를 항상 표시합니다.':
    'This column always uses default rejection feedback.',
  '검증 설정': 'Validation settings',
  '검증 설정은 안내·오류 비교 컬럼에만 적용합니다.':
    'Validation settings apply only to the feedback and errors column.',
  '첫 행의 안내·오류 비교 셀에 외부 오류를 표시했습니다.':
    'An external error was set on the feedback and errors cell in the first row.',
  '작성한 정규식은 정규식 적용 버튼을 눌러야 Grid에 반영됩니다. 빈 정규식은 문자 제한을 두지 않습니다.':
    'Choose Apply pattern to update the Grid with the draft pattern. An empty pattern leaves characters unrestricted.',
  '둘째 행의 기존 서버 값은 정책을 바꿔도 그대로 유지됩니다. 외부 오류는 첫 행의 두 번째 셀에서 비교합니다.':
    'Existing server values in the second row remain unchanged when policies change. Compare external errors in the second cell of the first row.',
  'Text 입력 정책': 'Text input policy',
  'Grid API': 'Grid API',
  'Hook 연결': 'Hook connection',
  'Ref 연결': 'Ref connection',
  '행 이동': 'Move rows',
  'hook으로 Grid API를 연결해 행 조회·셀 포커스 실행.':
    'Connect the Grid API with a hook to read rows and focus a cell.',
  'ref로 같은 Grid API를 연결해 행 조회·셀 포커스 실행.':
    'Connect the same Grid API with a ref to read rows and focus a cell.',
  '전체·필터링·선택 행 조회와 일괄 변경 가능.':
    'Read all, filtered or selected rows and apply batch updates.',
  '셀 값 변경·포커스·스크롤 제어 가능.': 'Change cell values and control focus and scrolling.',
  '선택한 행을 맨 위나 맨 아래로 이동 실행.': 'Move selected rows to the top or bottom.',
  '미확정 입력·working-copy 변경 조회와 확정·초기화 실행.':
    'Inspect uncommitted input and working-copy changes, then commit or reset them.',
  '행 조회': 'Read rows',
  '조회 결과: {{count}}건_one': 'Query result: {{count}} item',
  '조회 결과: {{count}}건_other': 'Query result: {{count}} items',
  '조회 결과: 전체 {{rows}}건 · 선택 {{selected}}건':
    'Query result: {{rows}} total · {{selected}} selected',
  '미저장 입력이 있습니다. Working-copy 변경 {{count}}건입니다.':
    'There is unsaved input. Working-copy changes: {{count}}.',
  '미저장 입력이 없습니다. Working-copy 변경 {{count}}건입니다.':
    'There is no unsaved input. Working-copy changes: {{count}}.',
  '변경을 되돌렸습니다.': 'Changes reverted.',
  '검사를 통과했습니다.': 'Validation passed.',
  '검사 결과: 오류 {{count}}건_one': 'Validation result: {{count}} error',
  '검사 결과: 오류 {{count}}건_other': 'Validation result: {{count}} errors',
  '저장했습니다: {{count}}건_one': 'Saved: {{count}} item',
  '저장했습니다: {{count}}건_other': 'Saved: {{count}} items',
  '서버 저장은 완료됐지만 Grid에 반영하지 못했습니다. 편집을 마친 뒤 다시 저장해 주세요.':
    'The server saved the data, but the Grid could not apply it. Finish editing and save again.',
  '셀·행 클릭 결과는 이벤트 탭에서 확인할 수 있습니다.':
    'View cell and row click results in the Events tab.',
  '안정적인 API 객체로 연결된 Grid 제어 가능. 연결 전·해제 후 호출 시 ReferenceError 발생.':
    'Control the connected Grid through a stable API object. Calls before connection or after disconnection throw ReferenceError.',
  'ref.current로 연결된 Grid 제어 가능. 연결 전·해제 후 current는 null.':
    'Control the connected Grid through ref.current. The current value is null before connection and after disconnection.',
  'Hook과 Ref는 같은 Grid API를 제공하며 연결 방식만 다름.':
    'Hook and Ref expose the same Grid API through different connections.',
  'hook API를 직접 호출해 선택한 행을 맨 위나 맨 아래로 이동.':
    'Call the hook API directly to move selected rows to the top or bottom.',
  'hook API로 전체 행, 필터링한 행, 선택한 행을 각각 조회하고 한 번에 변경.':
    'Use the hook API to query all, filtered or selected rows and update them in one transaction.',
  'hook API로 draft를 포함한 미저장 상태와 working-copy 변경을 조회하고 확정·초기화.':
    'Use the hook API to inspect unsaved drafts and working-copy changes, then accept or reset them.',
  '기존 ref로 셀 값과 포커스를 제어하며, 같은 Grid에 hook API도 연결.':
    'Control cell values and focus with the existing ref while connecting a hook API to the same Grid.',
  'draft를 포함한 미저장 상태와 working-copy 변경을 조회하고 확정·초기화.':
    'Inspect unsaved drafts and working-copy changes, then accept or reset them.',
  '우클릭 메뉴에서 상세 보기·수정·삭제를 실행하고 다이얼로그에서 메인 Grid를 조회.':
    'View, edit or delete rows from the context menu and query the main Grid from a dialog.',
  '현재 변경 상태 조회': 'Inspect current changes',
  'Working-copy 변경 {{count}}건': 'Working-copy changes: {{count}}',
  'hasUnsavedChanges()로 미확정 입력까지 감지 가능. getChanges()는 working-copy 변경만 반환. 현재 변경 상태 조회 버튼은 편집을 확정하지 않으며, 결과는 조회 시점 기준.':
    'hasUnsavedChanges() includes uncommitted input; getChanges() returns working-copy changes. The Inspect current changes button keeps the editor open and shows values at the time of the query.',
  '입력값은 다이얼로그를 연 시점의 행. 전달받은 API로 버튼을 누른 시점의 메인 Grid 조회 가능.':
    'The fields use the row captured when the dialog opened. Query the passed API to read main Grid values when the button is pressed.',
  '메인 Grid 현재 값 조회': 'Read current main Grid values',
  'useDataGridApi() 객체를 Grid의 api에 연결. 이벤트·Effect에서 최신 Grid 값 조회 가능. 객체·메서드 reference 유지. React 상태 자동 구독은 미지원.':
    'Connect the useDataGridApi() object to the Grid api prop. Read current Grid values in events or Effects. Object and method references stay stable; React state subscriptions are not automatic.',
  'API 객체당 Grid 하나에만 연결 가능. 연결 전·해제 후 호출 시 ReferenceError 발생. Grid 마운트 중에만 호출. 기존 ref와 함께 연결 가능.':
    'Connect each API object to one Grid at a time. Calls before connection or after disconnection throw ReferenceError; call methods while the Grid is mounted. The same Grid can also use a ref.',
  '셀·컬럼 (Cells & columns)': 'Cells & columns',
  '스타일 (Style)': 'Style',
  '셀 병합 (Cell spanning)': 'Cell spanning',
  '선택·이벤트 (Selection & events)': 'Selection & events',
  '정렬·필터 (Sorting & filtering)': 'Sorting & filtering',
  '편집·검증 (Editing & validation)': 'Editing & validation',
  '행 관리 (Row management)': 'Row management',
  '집계·계산 (Aggregation)': 'Aggregation',
  '트리·상세 (Tree & detail)': 'Tree & detail',
  '데이터·로딩 (Data & loading)': 'Data & loading',
  '내보내기 (Export)': 'Export',
  시작: 'Getting started',
  선택·합계: 'Selection & totals',
  '행 선택, 상태 배지와 합계를 표시합니다.': 'Display row selection, status badges and totals.',
  '최소 구성': 'Minimal setup',
  '컬럼 3개와 행 ID만 지정한 가장 작은 구성입니다.':
    'A minimal grid with three columns and row IDs.',
  '데이터 없음': 'No data',
  '로딩·빈 데이터·오류': 'Loading, empty and error',
  '로딩 중·데이터 없음·오류 화면을 확인하고, 오류 화면에서 다시 조회 가능.':
    'Switch between loading, empty and error states, then retry loading data.',
  '조회 결과가 없을 때 안내를 표시합니다.': 'Show a message when no rows are returned.',
  로딩: 'Loading',
  '조회 중 표시를 켜고 끕니다.': 'Toggle the loading state.',
  오류·재시도: 'Error & retry',
  '데이터 없이 실패 메시지를 표시합니다. 재시도하면 12행을 채웁니다.':
    'Start without data and load 12 rows on retry.',
  '표시 행 수': 'Visible row count',
  '표시 공간을 10행으로 고정하고, 데이터 10개를 채웁니다.':
    'Reserve space for 10 rows and fill it with 10 data rows.',
  '외부 버튼 제어': 'External button controls',
  '그리드 밖의 버튼으로 행을 선택·해제·삭제합니다. 선택한 행이 있을 때 삭제할 수 있습니다.':
    'Select, clear and delete rows using external buttons. Delete is available when rows are selected.',
  '둥근 모서리': 'Rounded corners',
  '모서리 크기를 선택합니다. 기본 크기는 4px입니다.':
    'Choose a corner size. The initial size is 4px.',
  '셀 타입': 'Cell types',
  '텍스트·숫자·셀렉트·날짜 등 셀 타입에 맞는 편집기 사용 가능.':
    'Edit values with different cell types.',
  '숫자·날짜 서식': 'Number & date formats',
  '숫자와 날짜·시간 서식을 설정.': 'Set number, date and time formats.',
  셀렉트: 'Select',
  '검색 없는 셀렉트와 검색 가능한 자동완성에서 단일·다중 값을 선택합니다.':
    'Choose single or multiple values using a select menu or searchable autocomplete.',
  '셀 컴포넌트': 'Cell components',
  '버튼, 칩, 스위치와 진행률을 셀에 추가.':
    'Add buttons, chips, switches and progress bars to cells.',
  '커스텀 스타일': 'Custom styles',
  '글꼴, 여백, 그림자와 헤더 강조를 설정하고 화면 크기에 따라 조정합니다.':
    'Customize fonts, padding, shadows and header emphasis with responsive styles.',
  '조건부 스타일': 'Conditional styles',
  '값과 상태에 따라 셀·행 배경색을 바꾸고, 완료 행의 편집을 제한합니다.':
    'Style cells or rows by value and status, with optional editing locks for completed rows.',
  '행별 셀 타입': 'Types by row',
  '같은 컬럼에서 행마다 다른 편집기를 사용.': 'Use different editors within a column.',
  자동완성: 'Autocomplete',
  '입력한 이름으로 담당자를 찾습니다.': 'Find an owner by typing their name.',
  '고정 컬럼': 'Pinned columns',
  '가로로 스크롤해도 고정한 프로젝트 컬럼 위치 유지.':
    'Keep the pinned project column in place while scrolling horizontally.',
  '다단 헤더': 'Grouped headers',
  '관련 컬럼을 여러 줄의 헤더로 묶고, 하위 컬럼의 정렬 버튼을 켜고 끕니다.':
    'Group columns into multiple header rows and toggle sorting buttons on child columns.',
  '행 수에 따라 병합': 'Explicit row spans',
  '셀 값과 관계없이 지정한 행 수만큼 세로로 병합.':
    'An example of merging a fixed number of rows regardless of their values.',
  '자동 행 병합': 'Automatic row spans',
  '프로젝트 컬럼에서 같은 값이 연속된 셀을 세로로 병합.':
    'An example of automatically merging consecutive project cells with the same value.',
  '열 병합': 'Column spans',
  '작업 요약 셀을 가로로 병합.': 'An example of merging a task summary across columns.',
  '행·열 병합': 'Combined spans',
  '프로젝트 셀은 세로로, 작업 요약 셀은 가로로 병합.':
    'An example combining vertical project spans and horizontal task summary spans.',
  '그룹 선택': 'Group selection',
  '병합한 그룹을 함께 선택하고 삭제합니다.': 'Select and delete a merged group together.',
  '병합·가상 스크롤': 'Spans & virtualization',
  '1만 행의 데이터에서도 셀 병합과 가상 스크롤을 함께 사용합니다.':
    'Combine cell spanning and virtual scrolling across 10,000 rows.',
  병합·Excel: 'Spans & Excel',
  '헤더와 셀 병합, 고정 합계 행을 그대로 내보내기 실행.':
    'Export header and cell spans with pinned summary rows intact.',
  '행 선택': 'Row selection',
  '단일 선택과 다중 선택의 동작을 비교 가능.': 'Switch between single and multiple row selection.',
  '다중 정렬': 'Multiple sorting',
  '헤더를 눌러 정렬 순서와 우선순위를 변경.': 'Change sorting and priority from the headers.',
  '컬럼 필터': 'Column filters',
  '컬럼별 조건으로 목록을 좁힘.': 'Filter the list by column.',
  '셀 편집': 'Cell editing',
  '서버 저장': 'Server save',
  '셀을 편집한 뒤 Enter로 확정하거나 Esc로 취소.': 'Enter commits; Esc cancels.',
  '입력 검증': 'Validation',
  '필수값, 숫자 범위와 완료 수량을 검사.':
    'Check required values, number ranges and completed units.',
  '행 편집 툴바': 'Row editing toolbar',
  '툴바에서 행을 추가·삭제.': 'Add and delete rows from the toolbar.',
  '행 이동 · 드래그': 'Move rows · drag',
  '행을 하나씩 드래그하거나 선택한 여러 행을 함께 이동 가능.':
    'Drag rows individually or move selected rows together.',
  '컨텍스트 메뉴': 'Context menu',
  '셀을 우클릭하면 아이콘이 있는 상세 보기·수정·삭제 메뉴가 열립니다.':
    'Right-click a cell to open view, edit and delete actions with icons.',
  '일괄 변경': 'Batch changes',
  '여러 셀을 바꾸고 검증한 뒤 변경을 승인합니다.': 'Update cells, validate and approve changes.',
  '트리 · 부모 ID': 'Tree · parent IDs',
  '부모 ID로 하위 행을 연결합니다. 하위 데이터는 미리 불러오거나 펼칠 때 불러옵니다.':
    'Link child rows using parent IDs and load them upfront or on expansion.',
  트리·병합: 'Tree & spans',
  '트리 안에서 같은 프로젝트의 작업을 병합.':
    'An example of merging tasks with the same project within a tree.',
  '계산·셀 연동': 'Calculations & linked cells',
  '입력값으로 비용과 합계를 계산하고, 같은 프로젝트와 다른 프로젝트의 셀을 연동합니다.':
    'Calculate costs and totals from inputs and link cells within and across projects.',
  '상세 그리드': 'Nested grid',
  '행을 펼쳐 하위 작업과 합계를 표시.': 'Expand a row to show child tasks and totals.',
  '상세 패널': 'Detail panel',
  '상세 패널에 프로젝트 요약과 주간 실적을 표시.':
    'An example showing a project summary and weekly progress.',
  '대용량 데이터': 'Large datasets',
  '1만~100만 행을 만들고 가상 스크롤을 확인.':
    'Generate 10,000 to 1,000,000 rows and explore virtualization.',
  'Excel 내보내기': 'Excel export',
  '표시·전체·선택 행의 Excel 내보내기 실행.': 'Export visible, all or selected rows.',
  '서버 조회': 'Server-side query',
  '행 추가 위치': 'Row insertion',
  '맨 위나 맨 아래, 또는 선택한 행 다음에 새 행을 추가.':
    'Add a row at the top, after the selected row or at the bottom.',
  삭제·복구: 'Delete & restore',
  '기존 행의 삭제·복구와 새로 추가한 행의 취소 동작을 비교 가능.':
    'Delete or restore selected rows; discard new rows.',
  '행 조회·일괄 처리': 'Read & process rows',
  '전체 행, 필터 결과, 선택 행을 조회하고 여러 셀을 한 번에 완료 처리합니다.':
    'Read all, filtered or selected rows and update their status and completed units together.',
  '셀 값·포커스': 'Values & focus',
  '셀 값을 바꾸고 원하는 행이나 셀로 이동.': 'Change a value, scroll to a row and focus a cell.',
  '행 이동 · 버튼': 'Move rows · buttons',
  '버튼으로 선택한 행을 맨 위나 맨 아래로 이동.':
    'Move selected rows to the top or bottom with buttons.',
  '변경 관리': 'Change management',
  '변경 내역을 확인한 뒤 확정하거나 원래 값으로 되돌릴 수 있음.':
    'Review changed values, then confirm or reset changes.',
  '검증 메시지': 'Validation messages',
  '외부 검증 결과를 셀에 표시하며, 필요할 때 메시지 삭제 가능.':
    'Display external validation results in cells and clear messages as needed.',
  '저장 응답 반영': 'Apply saved rows',
  '저장 중 편집한 값은 유지합니다.': 'Keep edits made while a save is in progress.',
  '하위 행 조회': 'Lazy children',
  '펼친 행의 하위 데이터를 불러옵니다.': 'Load child data when a row expands.',
  '트리 · 하위 행 배열': 'Tree · child arrays',
  'children 배열에 하위 행을 담습니다. 이 예제는 4단계 구성을 보여줍니다.':
    'Store child rows in children arrays. This example demonstrates four levels.',
  '새 행 선택': 'New row selection',
  '맨 위에 새 행을 추가한 뒤, 새 행의 선택 허용 여부 설정 가능.':
    'Add rows at the top and configure whether new rows can be selected.',
  '긴 내용 보기': 'View full content',
  '내용이 잘린 셀에 마우스를 올리면 전체 내용 확인 가능.':
    'Hover a truncated cell to see its full content.',
  '하위 헤더 정렬': 'Child header sorting',
  '다단 헤더의 하위 컬럼에서도 정렬을 사용합니다.':
    'Enable sorting on child columns of grouped headers.',
  '집계·고정 행': 'Summaries & pinned rows',
  '합계·평균을 계산하고, 하단에 안내 행을 고정.':
    'Calculate sums and averages with a pinned note at the bottom.',
  '클릭 이벤트': 'Click events',
  '셀이나 행을 클릭했을 때 전달되는 값을 확인.':
    'Inspect the values received from cell and row clicks.',
  'Excel 내보내기 API': 'Excel export API',
  '내보낼 데이터를 조회하고, 대용량은 나눠 읽습니다.':
    'Inspect export data and read large datasets in batches.',
  '정렬·필터 조건을 조회 함수에 넘기고, 받은 결과를 표시합니다.':
    'Pass sorting and filtering to a query function and show its result.',
  '파일 생성 전 데이터·제외 항목을 확인하고, 1만 행을 나눠 읽습니다.':
    'Inspect export data and excluded items, then read 10,000 rows in batches.',
  '연도 서식': 'Year format',
  '날짜를 YYYY로 표시하고 연도를 선택합니다.': 'Display dates as YYYY and choose a year.',
  '연월 서식': 'Year and month',
  '날짜를 YYYY-MM으로 표시하고 연월을 선택합니다.': 'Display dates as YYYY-MM and choose a month.',
  '셀 배경색': 'Cell background',
  '완료 수량 셀을 계획 달성 여부에 따라 구분합니다.':
    'Color completed units according to the planned target.',
  '행 배경색': 'Row background',
  '상태에 따라 행 배경색을 바꿉니다.': 'Change row backgrounds by status.',
  '표시 행 수 고정': 'Fixed row count',
  '화면에 표시할 행 수를 고정한 상태에서 행 선택과 합계를 확인 가능.':
    'Set a fixed row count and explore row selection and totals.',
  '외부 버튼으로 행 선택·해제·삭제 실행.':
    'Select, deselect and delete rows using external buttons.',
  '데이터가 없는 상태에서 로딩 표시를 켜고 끕니다.': 'Start and stop loading on an empty grid.',
  '조회 오류를 표시하고 다시 시도합니다.': 'Show a query error and retry.',
  '셀렉트와 자동완성의 단일 선택·다중 선택 동작을 비교 가능.':
    'Choose single or multiple values with select or autocomplete.',
  '조건에 따라 셀·행의 색상과 편집 가능 여부를 다르게 설정 가능.':
    'Set cell and row colors and editing restrictions.',
  '헤더와 셀의 스타일, 글자 크기 변경 가능.': 'Customize header and cell styles and font sizes.',
  '여러 컬럼을 다단 헤더로 묶음. 하위 컬럼의 정렬 버튼 표시 여부 설정 가능.':
    'Group columns and configure child header sorting buttons.',
  '1만 행에서 병합과 가상 스크롤을 확인.':
    'Explore spanning and virtual scrolling across 10,000 rows.',
  '우클릭 메뉴에서 상세 보기·수정·삭제를 실행.':
    'View, edit and delete rows from the context menu.',
  '전체 행, 필터링한 행, 선택한 행을 각각 조회하고 한 번에 변경.':
    'Read all, filtered or selected rows and update them together.',
  '내보낼 데이터와 제외 항목을 확인.': 'Inspect export data and excluded items.',
  '같은 프로젝트의 셀과 다른 프로젝트의 셀을 연동해 비용을 계산.':
    'An example of cost calculations and linked cells within and across projects.',
  트리: 'Tree',
  '하위 행의 완료율과 추세를 트리로 확인하며, 조회 방식 변경 가능.':
    'Inspect child-row completion rates and trends in a tree and switch query modes.',
  '다단계 트리': 'Nested tree',
  '여러 단계로 구성된 하위 행을 펼치거나 접기 가능.': 'Expand and collapse multi-level child rows.',
  'field·getRowId로 API 필드와 행 ID 연결. 문자열의 숫자·boolean 변환과 트리 행 연결은 model/apiData.ts 참고.':
    'Map API fields and row IDs with field and getRowId. See model/apiData.ts for numeric and boolean conversion and tree row mapping.',
  '같은 컬럼에서 행마다 다른 편집기 사용 가능.': 'Use different editors within a column.',
  '셀렉트와 자동완성의 단일 선택·다중 선택 동작 비교 가능.':
    'Choose single or multiple values using a select menu or searchable autocomplete.',
  '숫자와 날짜·시간 서식 설정 가능.': 'Configure number, date and time formats.',
  '버튼, 칩, 스위치와 진행률을 셀에 추가 가능.':
    'Add buttons, chips, switches and progress bars to cells.',
  '고정 컬럼과 가로 스크롤 동작 비교 가능.':
    'Compare pinned columns and horizontal scrolling behavior.',
  '다단 헤더 구성과 하위 컬럼 정렬 버튼 표시 여부 설정 가능.':
    'Group columns into multiple header rows and configure child header sorting buttons.',
  '셀 값과 관계없이 지정한 행 수만큼 세로로 병합 가능.':
    'Merge a fixed number of rows vertically regardless of values.',
  '프로젝트 컬럼에서 같은 값이 연속된 셀을 세로로 자동 병합 가능.':
    'Automatically merge consecutive cells with matching values vertically.',
  '작업 요약 셀 가로 병합 가능.': 'Merge summary cells horizontally across columns.',
  '프로젝트 셀 세로 병합과 작업 요약 셀 가로 병합 동시 적용 가능.':
    'Apply vertical project spans and horizontal summary spans together.',
  '1만 행 데이터에서 셀 병합과 가상 스크롤 동작 확인 가능.':
    'Verify cell spanning and virtual scrolling across 10,000 rows.',
  '단일 선택과 다중 선택의 동작 비교 가능.': 'Compare single and multiple row selection behavior.',
  '셀이나 행을 클릭했을 때 전달되는 이벤트 값 확인 가능.':
    'Inspect event values received from cell or row clicks.',
  '우클릭 메뉴에서 상세 보기·수정·삭제를 실행하고 다이얼로그에서 메인 Grid 조회 가능.':
    'Execute view, edit and delete from context menu and query the main Grid in a dialog.',
  '헤더 클릭으로 정렬 순서와 다중 정렬 우선순위 변경 가능.':
    'Change sort order and multiple column priority by clicking headers.',
  '컬럼별 조건으로 데이터 필터링 가능.': 'Filter data using conditions per column.',
  '셀 편집 후 Enter로 확정하거나 Esc로 취소 가능.':
    'Edit cells and commit with Enter or cancel with Esc.',
  '같은 Grid에 hook API와 ref를 연결해 셀 값·포커스 제어 가능.':
    'Control cell values and focus by connecting both hook API and ref to the same Grid.',
  '값 확정 시 검사와 직접 검사, 셀 수정 시 오류 처리 비교 가능.':
    'Compare validation on commit with manual checks and error handling when cells are edited.',
  '필수값, 숫자 범위와 완료 수량 검사 가능.':
    'Validate required fields, numeric ranges and completed quantities.',
  '행 편집 툴바에서 행 추가·삭제 실행.': 'Add and delete rows using the row editing toolbar.',
  '맨 위·맨 아래 또는 선택 행 다음에 새 행 추가 실행.':
    'Insert a new row at the top, bottom, or after the selected row.',
  '기존 행 삭제·복구와 새 행 취소 동작 비교 가능.':
    'Compare deleting or restoring existing rows and discarding newly added rows.',
  'hook API 직접 호출로 선택한 행을 맨 위나 맨 아래로 이동 실행.':
    'Call the hook API directly to move selected rows to the top or bottom.',
  'hook API로 전체·필터링·선택 행 조회와 일괄 변경 가능.':
    'Query all, filtered, or selected rows and apply batch updates using the hook API.',
  'hook API로 미확정 입력·working-copy 변경 조회와 확정·초기화 실행.':
    'Inspect uncommitted input and working-copy changes, then commit or reset them using the hook API.',
  '합계·평균 계산과 하단 안내 행 고정 가능.':
    'Calculate sums and averages while keeping informational summary rows pinned at the bottom.',
  '프로젝트 내·프로젝트 간 셀 연동과 비용 계산 가능.':
    'Link cells within and across projects to calculate costs and totals.',
  '여러 단계의 하위 행 펼치기·접기 가능.': 'Expand and collapse multi-level child rows.',
  '트리 구조 안에서 같은 프로젝트 작업 셀 병합 가능.':
    'Merge task cells for the same project within a tree structure.',
  '상세 패널에 프로젝트 요약과 주간 실적 표시 가능.':
    'Display project summaries and weekly progress in a custom detail panel.',
  '행을 펼쳐 하위 작업과 합계 그리드 표시 가능.':
    'Expand rows to display child tasks and summary grids.',
  '화면에 표시할 행 수를 고정한 상태에서 행 선택과 합계 확인 가능.':
    'Set a fixed visible row count while verifying row selection and totals.',
  '로딩 중·데이터 없음·오류 화면 확인과 재조회 실행 가능.':
    'Verify loading, empty, and error states, and retry queries on error.',
  '1만~100만 행 데이터 생성과 가상 스크롤 동작 확인 가능.':
    'Generate 10,000 to 1,000,000 rows and verify virtual scrolling performance.',
  '내보낼 데이터 구조와 제외 항목 확인 가능.': 'Inspect export data structure and excluded items.',
  'field·getRowId로 API 필드와 행 ID를 연결합니다. 문자열의 숫자·boolean 변환과 트리 행 연결은 model/apiData.ts를 참고해 주세요.':
    'Map API fields and row IDs with field and getRowId. See model/apiData.ts for numeric and boolean conversion and tree row mapping.',
  'Hook과 Ref는 같은 Grid API를 제공하며 연결 방식만 다릅니다.':
    'Hook and Ref expose the same Grid API through different connections.',
  'useDataGridApi() 객체를 Grid의 api에 연결합니다. 이벤트·Effect에서 최신 Grid 값을 조회할 수 있습니다. 객체·메서드 reference를 유지합니다. React 상태 자동 구독은 지원하지 않습니다.':
    'Connect the useDataGridApi() object to the Grid api prop. Read current Grid values in events or Effects. Object and method references stay stable; React state subscriptions are not automatic.',
  'API 객체당 Grid 하나에만 연결할 수 있습니다. 연결 전·해제 후에 호출하면 ReferenceError가 발생합니다. Grid가 마운트된 동안에만 호출해 주세요. 기존 ref와 함께 연결할 수 있습니다.':
    'Connect each API object to one Grid at a time. Calls before connection or after disconnection throw ReferenceError; call methods while the Grid is mounted. The same Grid can also use a ref.',
  셀·컬럼: 'Cells & columns',
  스타일: 'Style',
  '셀 병합': 'Cell spans',
  선택·이벤트: 'Selection & events',
  정렬·필터: 'Sorting & filtering',
  편집·검증: 'Editing & validation',
  '행 관리': 'Row management',
  집계·계산: 'Aggregation',
  트리·상세: 'Tree & detail',
  데이터·로딩: 'Data & loading',
  내보내기: 'Export',
  'Mock API 저장': 'Mock API save',
  'Mock API 조회': 'Mock API query',
  '로컬 Mock API의 저장 응답과 저장 중 추가 편집 보존 확인 가능.':
    'Inspect local Mock API save responses and preserve edits made while saving.',
  '로컬 Mock API에 정렬·필터 조건 전달과 조회 결과 표시 가능.':
    'Pass sorting and filter parameters to a local Mock API and display the results.',
};
