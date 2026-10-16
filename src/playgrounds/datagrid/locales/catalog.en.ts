export const catalogEnglish: Readonly<Record<string, string>> = {
  '기본 (Basics)': 'Basics',
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
  '셀 타입별로 값을 편집합니다.': 'Edit values with different cell types.',
  '숫자·날짜 서식': 'Number & date formats',
  '숫자와 날짜·시간 서식을 설정합니다.': 'Set number, date and time formats.',
  셀렉트: 'Select',
  '검색 없는 셀렉트와 검색 가능한 자동완성에서 단일·다중 값을 선택합니다.':
    'Choose single or multiple values using a select menu or searchable autocomplete.',
  '셀 컴포넌트': 'Cell components',
  '버튼, 칩, 스위치와 진행률을 셀에 추가합니다.':
    'Add buttons, chips, switches and progress bars to cells.',
  '커스텀 스타일': 'Custom styles',
  '글꼴, 여백, 그림자와 헤더 강조를 설정하고 화면 크기에 따라 조정합니다.':
    'Customize fonts, padding, shadows and header emphasis with responsive styles.',
  '조건부 스타일': 'Conditional styles',
  '값과 상태에 따라 셀·행 배경색을 바꾸고, 완료 행의 편집을 제한합니다.':
    'Style cells or rows by value and status, with optional editing locks for completed rows.',
  '행별 셀 타입': 'Types by row',
  '같은 컬럼에서 행마다 다른 편집기를 사용합니다.': 'Use different editors within a column.',
  자동완성: 'Autocomplete',
  '입력한 이름으로 담당자를 찾습니다.': 'Find an owner by typing their name.',
  '고정 컬럼': 'Pinned columns',
  '프로젝트 컬럼을 고정하고 가로로 스크롤하는 예시입니다.':
    'An example of pinning the project column while scrolling horizontally.',
  '다단 헤더': 'Grouped headers',
  '관련 컬럼을 여러 줄의 헤더로 묶고, 하위 컬럼의 정렬 버튼을 켜고 끕니다.':
    'Group columns into multiple header rows and toggle sorting buttons on child columns.',
  '지정 행 병합': 'Explicit row spans',
  '값과 관계없이 지정한 행 수만큼 셀을 병합하는 예시입니다.':
    'An example of merging a fixed number of rows regardless of their values.',
  '자동 행 병합': 'Automatic row spans',
  '프로젝트 컬럼에서 같은 값이 연속된 셀을 자동 병합하는 예시입니다.':
    'An example of automatically merging consecutive project cells with the same value.',
  '열 병합': 'Column spans',
  '작업 요약 셀을 가로로 병합하는 예시입니다.':
    'An example of merging a task summary across columns.',
  '행·열 병합': 'Combined spans',
  '프로젝트의 세로 병합과 작업 요약의 가로 병합을 함께 보여주는 예시입니다.':
    'An example combining vertical project spans and horizontal task summary spans.',
  '그룹 선택': 'Group selection',
  '병합한 그룹을 함께 선택하고 삭제합니다.': 'Select and delete a merged group together.',
  '병합·가상 스크롤': 'Spans & virtualization',
  '1만 행의 데이터에서도 셀 병합과 가상 스크롤을 함께 사용합니다.':
    'Combine cell spanning and virtual scrolling across 10,000 rows.',
  병합·Excel: 'Spans & Excel',
  '헤더와 셀 병합, 고정 합계 행을 그대로 내보냅니다.':
    'Export grouped headers, spans and pinned totals.',
  '행 선택': 'Row selection',
  '단일·다중 선택을 전환합니다.': 'Switch between single and multiple row selection.',
  '다중 정렬': 'Multiple sorting',
  '헤더를 눌러 정렬 순서와 우선순위를 바꿉니다.': 'Change sorting and priority from the headers.',
  '컬럼 필터': 'Column filters',
  '컬럼별 조건으로 목록을 좁힙니다.': 'Filter the list by column.',
  '셀 편집': 'Cell editing',
  'Enter로 확정하고 Esc로 취소합니다.': 'Enter commits; Esc cancels.',
  '입력 검증': 'Validation',
  '필수값, 숫자 범위와 완료 수량을 검사합니다.':
    'Check required values, number ranges and completed units.',
  '행 편집 툴바': 'Row editing toolbar',
  '툴바에서 행을 추가·삭제합니다.': 'Add and delete rows from the toolbar.',
  '행 이동 · 드래그': 'Move rows · drag',
  '한 행이나 선택한 행을 드래그로 옮깁니다.': 'Drag one row or the selected rows.',
  '컨텍스트 메뉴': 'Context menu',
  '셀을 우클릭하면 아이콘이 있는 상세 보기·수정·삭제 메뉴가 열립니다.':
    'Right-click a cell to open view, edit and delete actions with icons.',
  '일괄 변경': 'Batch changes',
  '여러 셀을 바꾸고 검증한 뒤 변경을 승인합니다.': 'Update cells, validate and approve changes.',
  '트리 · 부모 ID': 'Tree · parent IDs',
  '부모 ID로 하위 행을 연결합니다. 하위 데이터는 미리 불러오거나 펼칠 때 불러옵니다.':
    'Link child rows using parent IDs and load them upfront or on expansion.',
  트리·병합: 'Tree & spans',
  '트리 안에서 같은 프로젝트의 작업을 병합하는 예시입니다.':
    'An example of merging tasks with the same project within a tree.',
  '계산·셀 연동': 'Calculations & linked cells',
  '입력값으로 비용과 합계를 계산하고, 같은 프로젝트와 다른 프로젝트의 셀을 연동합니다.':
    'Calculate costs and totals from inputs and link cells within and across projects.',
  '상세 그리드': 'Nested grid',
  '행을 펼쳐 하위 작업과 합계를 표시합니다.': 'Expand a row to show child tasks and totals.',
  '상세 패널': 'Detail panel',
  '프로젝트 요약과 주간 실적을 표시하는 예시입니다.':
    'An example showing a project summary and weekly progress.',
  '대용량 데이터': 'Large datasets',
  '1만~100만 행을 만들고 가상 스크롤을 확인합니다.':
    'Generate 10,000 to 1,000,000 rows and explore virtualization.',
  'Excel 내보내기': 'Excel export',
  '표시 행, 전체 행, 선택 행을 각각 내보냅니다.': 'Export visible, all or selected rows.',
  '서버 조회': 'Server-side query',
  '모의 조회로 서버 정렬과 필터를 확인합니다.':
    'Try server sorting and filtering with simulated requests.',
  '행 추가 위치': 'Row insertion',
  '상단, 선택한 행 다음, 하단에 새 행을 추가합니다.':
    'Add a row at the top, after the selected row or at the bottom.',
  삭제·복구: 'Delete & restore',
  '선택 행은 삭제·복구, 새 행은 취소합니다.': 'Delete or restore selected rows; discard new rows.',
  '행 조회·일괄 처리': 'Read & process rows',
  '전체 행, 필터 결과, 선택 행을 조회하고 여러 셀을 한 번에 완료 처리합니다.':
    'Read all, filtered or selected rows and update their status and completed units together.',
  '셀 값·포커스': 'Values & focus',
  '셀 값을 바꾸고, 원하는 행과 셀로 이동합니다.':
    'Change a value, scroll to a row and focus a cell.',
  '행 이동 · 버튼': 'Move rows · buttons',
  '버튼으로 선택한 행을 맨 위나 맨 아래로 옮깁니다.':
    'Move selected rows to the top or bottom with buttons.',
  '변경 관리': 'Change management',
  '변경된 값을 확인하고, 변경을 확정하거나 되돌립니다.':
    'Review changed values, then confirm or reset changes.',
  '검증 메시지': 'Validation messages',
  '외부에서 받은 검증 메시지를 셀에 표시하고 지웁니다.':
    'Display and clear externally provided validation messages in cells.',
  '저장 응답 반영': 'Apply saved rows',
  '저장 중 편집한 값은 유지합니다.': 'Keep edits made while a save is in progress.',
  '하위 행 조회': 'Lazy children',
  '펼친 행의 하위 데이터를 불러옵니다.': 'Load child data when a row expands.',
  '트리 · 하위 행 배열': 'Tree · child arrays',
  'children 배열에 하위 행을 담습니다. 이 예제는 4단계 구성을 보여줍니다.':
    'Store child rows in children arrays. This example demonstrates four levels.',
  '새 행 선택': 'New row selection',
  '새 행을 상단에 추가하고 체크박스 표시를 바꿉니다.':
    'Add rows at the top and toggle their checkboxes.',
  '긴 내용 보기': 'View full content',
  '잘린 셀에 마우스를 올리면 전체 내용을 보여줍니다.':
    'Hover a truncated cell to see its full content.',
  '하위 헤더 정렬': 'Child header sorting',
  '다단 헤더의 하위 컬럼에서도 정렬을 사용합니다.':
    'Enable sorting on child columns of grouped headers.',
  '집계·고정 행': 'Summaries & pinned rows',
  '합계·평균을 계산하고, 하단에 안내 행을 고정합니다.':
    'Calculate sums and averages with a pinned note at the bottom.',
  '클릭 이벤트': 'Click events',
  '셀과 행 클릭에서 받은 값을 확인합니다.': 'Inspect the values received from cell and row clicks.',
  'Excel 내보내기 API': 'Excel export API',
  '내보낼 데이터를 조회하고, 대용량은 나눠 읽습니다.':
    'Inspect export data and read large datasets in batches.',
  '정렬·필터 조건을 조회 함수에 넘기고, 받은 결과를 표시합니다.':
    'Pass sorting and filtering to a query function and show its result.',
  '정렬·필터 조건을 넘겨 조회한 결과를 표시합니다. 모의 서버를 사용합니다.':
    'Query with sorting and filtering using a simulated server.',
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
  '표시할 행 수를 고정하고, 행 선택과 합계를 확인합니다.':
    'Set a fixed row count and explore row selection and totals.',
  '외부 버튼으로 행을 선택·해제·삭제합니다.':
    'Select, clear and delete rows with external buttons.',
  '빈 화면에서 로딩을 시작·종료합니다.': 'Start and stop loading on an empty grid.',
  '조회 오류를 표시하고 다시 시도합니다.': 'Show a query error and retry.',
  '셀렉트·자동완성으로 단일·다중 값을 선택합니다.':
    'Choose single or multiple values with select or autocomplete.',
  '셀·행 색상과 편집 제한을 설정합니다.': 'Set cell and row colors and editing restrictions.',
  '스타일과 글자 크기를 바꿉니다.': 'Change styles and font size.',
  '컬럼을 묶고 하위 헤더의 정렬 버튼을 설정합니다.':
    'Group columns and configure child header sorting buttons.',
  '1만 행에서 병합과 가상 스크롤을 확인합니다.':
    'Explore spanning and virtual scrolling across 10,000 rows.',
  '우클릭 메뉴에서 상세 보기·수정·삭제를 실행합니다.':
    'View, edit and delete rows from the context menu.',
  '전체·필터·선택 행을 조회하고 일괄 변경합니다.':
    'Read all, filtered or selected rows and update them together.',
  '내보낼 데이터와 제외 항목을 확인합니다.': 'Inspect export data and excluded items.',
  '비용을 계산하고, 같은 프로젝트와 다른 프로젝트의 셀을 연동하는 예시입니다.':
    'An example of cost calculations and linked cells within and across projects.',
  트리: 'Tree',
  '하위 행의 완료율과 추세를 확인하고 조회 방식을 바꿉니다.':
    'View child-row completion and trends, and change the loading mode.',
  '다단계 트리': 'Nested tree',
  '여러 단계의 하위 행을 펼치고 접습니다.': 'Expand and collapse multiple levels of child rows.',
  '정렬·필터 조건으로 모의 서버를 조회합니다.':
    'Query a simulated server with sorting and filters.',
};
