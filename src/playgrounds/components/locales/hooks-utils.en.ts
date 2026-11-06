export const hooksUtilsEnglish = {
  '메모 입력': 'Enter a note',
  '알림 창 열기': 'Open alert',
  '확인 창 열기': 'Open confirmation',
  '입력창 열기': 'Open input dialog',
  'Dialog를 열지 못했습니다.': 'Could not open the Dialog.',
  '계속 진행하시겠습니까?': 'Would you like to continue?',
  '확인하거나 취소할 수 있습니다.': 'You can confirm or cancel.',
  확인: 'OK',
  취소: 'Cancel',
  '문구를 직접 지정한 확인창': 'Custom confirmation text',
  'onClose callback은 한 번 실행되고 완료 후 결과 Promise가 끝납니다. closeAll에서는 callback이 false를 받고 Promise 결과는 undefined입니다.':
    'onClose runs once and completes before the result Promise resolves. With closeAll, the callback receives false and the Promise result is undefined.',
  '확인 버튼만 있는 안내': 'Information with one button',
  'confirmInfo는 기본 안내 문구와 확인 버튼을 사용합니다.':
    'confirmInfo uses its default text and an OK button.',
  '저장·수정·삭제 기본값': 'Save, update, and delete defaults',
  '각 helper의 기본 문구를 비교합니다. 삭제 확인 버튼은 error 색상을 사용합니다.':
    'Compare default text. Delete uses the error button color.',
  '포커스 확인 입력': 'Focus test input',
  '입력에 포커스를 두고 Enter를 누르세요.': 'Focus this input and press Enter.',
  '입력에 포커스': 'Focus input',
  'Dialog 열기': 'Open Dialog',
  '포커스 이동 확인': 'Inspect focus movement',
  '기존 활성 요소를 blur한 뒤 Dialog의 버튼으로 포커스를 옮깁니다.':
    'Blur the active element, then focus the Dialog button.',
  닫기: 'Close',
  '버튼에서 Dialog 열기': 'Open a Dialog from a button',
  '버튼 클릭으로 open을 요청하고 Hook이 반환한 값을 Dialog에 전달합니다.':
    'Request open on click and pass the Hook result to Dialog.',
  '입력에서 Dialog 열기': 'Open a Dialog from an input',
  '입력의 Enter 이벤트로 열어도 기존 활성 요소를 blur한 뒤 Dialog를 표시합니다.':
    'Opening from Enter also blurs the active element first.',
  '샘플 메모': 'Sample note',
  '확인 후 횟수 늘리기': 'Confirm and increment count',
  '저장 기준 갱신': 'Update saved baseline',
  '저장하지 않은 변경 사항이 있습니다.': 'There are unsaved changes.',
  '변경 사항이 없습니다.': 'There are no changes.',
  '변경이 없는 영역': 'An area without changes',
  'dirty가 false이면 확인창 없이 지정한 action을 수행합니다.':
    'When dirty is false, run the action without confirmation.',
  '변경이 있는 영역': 'An area with changes',
  '승인하면 action 횟수만 늘어납니다. Hook은 메모나 저장 기준을 바꾸지 않습니다.':
    'Approval only increments the count; notes and baseline stay unchanged.',
  '요청할 때 getter로 평가': 'Evaluate a getter on request',
  'getter가 요청 시점의 메모와 저장 기준을 비교합니다. 취소하면 action은 수행하지 않습니다.':
    'Compare the note and baseline on request. Cancel skips the action.',
  '헤더 너비': 'Header width',
  '샘플 헤더': 'Sample header',
  '검색 조건': 'Search filters',
  검색: 'Search',
  초기화: 'Reset',
  '실제 너비 측정': 'Measure the available width',
  'Hook은 한 줄에 들어가는지 측정합니다. 예제는 isWrapped에 따라 flexWrap을 지정합니다.':
    'The Hook measures fit; this example sets flexWrap from isWrapped.',
  '측정 중지와 한 줄 기본값': 'Disable measurement with false fallback',
  'enabled가 false이면 측정을 중지하고 기본값 false를 반환합니다.':
    'With enabled=false, skip measurement and return false by default.',
  '측정 중지와 줄바꿈 기본값': 'Disable measurement with true fallback',
  '측정을 중지해도 wrappedWhenDisabled를 true로 지정하면 true를 반환합니다.':
    'wrappedWhenDisabled=true returns true when measurement is disabled.',
  '샘플 작업 시작': 'Start sample task',
  '처리 중 안내가 보입니다.': 'The processing message is visible.',
  '처리 중 안내가 닫혔습니다.': 'The processing message is closed.',
  '기본 최소 시간': 'Default minimum duration',
  '100ms 작업이 끝나도 기본 최소 시간인 400ms 동안 안내를 유지합니다.':
    'Keep the message for 400ms even when the task ends after 100ms.',
  '최소 시간을 1초로 지정': 'Set a one-second minimum',
  '같은 100ms 작업에 1초의 최소 표시 시간을 지정합니다.':
    'Use a one-second minimum for the same 100ms task.',
  '작업이 최소 시간보다 긴 경우': 'A task longer than the minimum',
  '작업이 1.2초 동안 이어지면 400ms가 지나도 안내를 닫지 않습니다.':
    'A 1.2-second task keeps the message open beyond 400ms.',
  'Dialog 결과': 'Dialog result',
  '메시지를 확인해 주세요.': 'Please review the message.',
  '메모를 입력해 주세요.': 'Please enter a note.',
  '알림을 닫은 뒤 계속하기': 'Continue after closing an alert',
  'alert의 Promise는 확인 버튼으로 창을 닫으면 완료됩니다.':
    'The alert Promise resolves after closing it with OK.',
  '확인과 취소 결과': 'Confirm and cancel results',
  'confirm은 확인하면 true, 취소하면 false를 반환합니다.':
    'confirm returns true on confirmation and false on cancellation.',
  '입력값과 취소 결과': 'Input and cancellation results',
  'dialogs.open으로 custom OwpDialog를 엽니다. 예제의 확인 버튼은 입력 문자열을, 취소는 null을 전달합니다.':
    'Use dialogs.open with a custom OwpDialog. Confirm passes the input string; cancel passes null.',
  '안녕하세요, {{name}}님.': 'Hello, {{name}}.',
  '선택한 항목 {{count}}개': 'Selected items: {{count}}',
  '번역이 없을 때 표시할 문장': 'Text to show when a translation is missing',
  '이름 interpolation': 'Name interpolation',
  '이름을 바꾸면 같은 번역 key의 name 값이 바뀝니다.':
    'Change the name value within the same translation key.',
  '인사할 이름': 'Greeting name',
  '수량과 현재 언어': 'Count and current language',
  '수량은 count로 전달합니다. 화면 상단에서 언어를 바꾸면 번역도 갱신됩니다.':
    'Pass count and change the page language to update translations.',
  '선택 수량': 'Selected count',
  'defaultValue로 기본 문구 지정': 'Set fallback text with defaultValue',
  '등록하지 않은 key에 defaultValue를 지정하면 해당 문구를 표시합니다.':
    'For a missing key, display its explicit defaultValue.',
  '모바일 viewport입니다.': 'This is a mobile viewport.',
  '모바일보다 넓은 viewport입니다.': 'This viewport is wider than mobile.',
  '현재 device 확인': 'Inspect the current device',
  '각 예제는 실제 viewport를 독립적으로 구독합니다. 창 너비를 바꿔 비교하세요.':
    'Each example subscribes to the actual viewport. Resize to compare.',
  '넓이에 따라 버튼 배치': 'Arrange buttons by viewport width',
  'isTabletOrDown이 true이면 버튼을 세로로, false이면 가로로 배치합니다.':
    'Stack buttons when isTabletOrDown is true; otherwise use a row.',
  '모바일 안내 구분': 'Distinguish mobile guidance',
  'isMobile은 xs에서만 true입니다. 좁은 카드의 너비를 device로 해석하지 않습니다.':
    'isMobile is true only at xs; card width does not determine device.',
  '저장하지 않고 계속 진행하시겠습니까?': 'Continue without saving?',
  '계속 편집': 'Keep editing',
  '진행 승인': 'Approve action',
  '변경 내용이 없는 경우': 'Without unsaved changes',
  '메모가 비어 있으면 확인 요청을 만들지 않고 action을 수행합니다.':
    'An empty note runs the action without a confirmation request.',
  '승인·취소를 직접 연결': 'Connect approval and cancellation',
  'snapshot을 구독해 확인 UI를 표시합니다. cancel()을 호출하면 action 없이 요청 결과가 false가 됩니다.':
    'Subscribe to show confirmation. cancel() resolves false without an action.',
  '서로 다른 영역의 변경 확인': 'Check changes in separate areas',
  '이 영역의 확인 요청은 다른 영역과 독립적입니다. 승인해도 메모와 dirty는 유지됩니다.':
    'This area owns its request. Approval keeps the note and dirty state.',
  'boolean을 그대로 평가': 'Evaluate a boolean',
  'false와 true를 그대로 반환합니다. 평가 때문에 입력값이나 저장 기준을 바꾸지 않습니다.':
    'Return false or true unchanged, without changing input or baseline.',
  '부작용 없는 동기 getter': 'A synchronous getter without side effects',
  '함수를 전달하면 호출 결과를 반환합니다. 두 getter의 결과를 동시에 비교하세요.':
    'Return the getter result. Compare both results at once.',
  '버튼을 누른 시점의 메모': 'Evaluate the note on click',
  '현재 메모에 입력한 내용이 있는지 getter로 평가합니다. 메모를 바꿔도 마지막 평가 결과는 다음 클릭까지 유지됩니다.':
    'Check whether the current note has content. Keep that result until the next click.',
  '현재 dirty 평가': 'Evaluate current dirty state',
  '차트가 들어갈 콘텐츠 영역': 'Chart content area',
  '180px 고정 높이와 비교': 'Compare a fixed 180px height',
  'helper를 쓰지 않고 180px 높이를 지정한 일반 영역입니다.':
    'A plain area with a 180px height and no helper.',
  'viewport에 맞춘 프레임 높이': 'Frame height for the viewport',
  'sm 미만에서는 360px, sm 이상에서는 420px입니다. 직접 자식은 프레임 크기를 채웁니다.':
    'Use 360px below sm and 420px from sm. Direct children fill the frame.',
  '프레임보다 넓은 콘텐츠': 'Content wider than its frame',
  '900px 콘텐츠를 넣어 가로 스크롤을 확인합니다. 세로 overflow는 숨깁니다.':
    'A 900px content area scrolls horizontally; vertical overflow is hidden.',
  '모든 width class 비교': 'Compare all width classes',
  'xs는 mobile, sm·md는 tablet, lg는 laptop, xl은 desktop에 대응합니다.':
    'xs maps to mobile, sm/md to tablet, lg to laptop, and xl to desktop.',
  'width class별 device': 'Device by width class',
  '선택한 class만 변환': 'Convert the selected class',
  '함수는 전달한 class를 변환합니다. 브라우저 너비를 측정하거나 viewport를 바꾸지 않습니다.':
    'Convert the input class without measuring or changing the viewport.',
  'device별 media query': 'Media query by device',
  '현재 theme의 media query': 'Queries from the current theme',
  '4개 device의 조건을 동시에 표시합니다. matches는 현재 viewport와 일치하는지 나타냅니다.':
    'Compare all four queries. matches indicates a viewport match.',
  'breakpoint를 바꾼 theme': 'A theme with different breakpoints',
  '별도 theme의 sm=480, lg=1024, xl=1440 값을 사용합니다. 앱 전체 theme는 바꾸지 않습니다.':
    'Use sm=480, lg=1024, xl=1440 in a separate theme; keep the app theme.',
  '검색 패널': 'Search panel',
  '차트 콘텐츠': 'Chart content',
  'helper를 적용하기 전': 'Before applying the helper',
  '두 영역을 가로로 배치한 비교 예제입니다. 프레임 높이도 지정하지 않았습니다.':
    'Two areas in a row, without a specified frame height.',
  '패널과 차트 프레임에 적용': 'Apply to the panel and chart frame',
  '전체를 세로로 배치하고 owp-chart-frame 클래스에 반응형 높이를 적용합니다.':
    'Stack the areas and set responsive height on owp-chart-frame.',
  '대상 클래스가 없는 자식': 'Children without target classes',
  '전체 세로 배치는 유지됩니다. owp-chart-frame 클래스가 없으면 프레임 높이를 지정하지 않습니다.':
    'Keep the column layout; frame height requires owp-chart-frame.',
  '최소 폭 표': 'Minimum-width table',
  이름: 'Name',
  상태: 'Status',
  설명: 'Description',
  준비: 'Ready',
  '최소 너비를 비교하는 셀': 'A cell for comparing minimum widths',
  '최소 너비를 지정하지 않은 표': 'A table without minimum width',
  '기본 OwpTable입니다. 화면이 좁아지면 셀의 너비와 줄 수가 달라집니다.':
    'The default OwpTable adapts cell width and wrapping to the screen.',
  '숫자로 720px 지정': 'Set a numeric 720px minimum',
  'lg 미만 viewport에서 minWidth 720을 적용합니다. 넘친 내용은 표 안에서 스크롤합니다.':
    'Below lg, apply minWidth 720 and scroll within the table area.',
  'CSS 길이로 60rem 지정': 'Set a CSS length of 60rem',
  '문자열 길이도 지원합니다. lg 이상에서는 이 helper가 최소 너비를 지정하지 않습니다.':
    'CSS lengths work too. This helper sets no minimum width from lg.',
  '도움말 정렬 표': 'Helper-text alignment table',
  '첫 번째 입력': 'First input',
  '입력값을 확인해 주세요.': 'Please check the input value.',
  '두 번째 입력': 'Second input',
  '도움말이 없는 행': 'A row without helper text',
  'helper를 적용해도 행 안에 도움말이 없으면 추가 여백을 만들지 않습니다.':
    'Without helper text in the row, no extra space is added.',
  '한 셀에만 도움말이 있는 행': 'Helper text in only one cell',
  '보정 전의 표입니다. 첫 번째 입력의 도움말 때문에 입력 위치가 달라질 수 있습니다.':
    'Before correction, helper text may shift input alignment.',
  '다른 셀에도 도움말 높이 확보': 'Reserve helper-text height in other cells',
  '도움말이 없는 콘텐츠에 after 여백을 추가합니다. 도움말이 있는 콘텐츠에는 중복 추가하지 않습니다.':
    'Add after space only to content without its own helper text.',
  '병합한 옵션': 'Merged options',
  '먼저 전달한 A 유지': 'Keep the first A',
  '첫 그룹의 Alpha가 남고 두 번째 그룹의 새 항목 C가 뒤에 추가됩니다.':
    'Keep Alpha from the first group and append the new C option.',
  '그룹 순서를 바꾼 결과': 'Reverse the group order',
  '두 번째 그룹을 먼저 전달하면 A의 label은 Alpha replacement가 됩니다.':
    'Passing the second group first gives A the label Alpha replacement.',
  'undefined와 빈 그룹': 'Undefined and empty groups',
  'undefined와 빈 배열은 항목을 추가하지 않습니다. 인수가 없으면 빈 배열입니다.':
    'Undefined and empty groups add nothing. No arguments returns [].',
  'sx 객체 하나': 'A single sx object',
  '기본 sx 객체를 배열 형태로 반환하며 MUI의 sx에 그대로 전달합니다.':
    'Return the sx object in an array for MUI sx.',
  '기본 스타일': 'Base style',
  '전달 순서에 따른 덮어쓰기': 'Override by input order',
  '뒤에 전달한 sx가 앞의 값을 덮어씁니다. 두 영역의 배경을 비교하세요.':
    'Later sx overrides earlier values. Compare the backgrounds.',
  '강조 스타일이 나중': 'Emphasis last',
  '기본 스타일이 나중': 'Base style last',
  '배열과 생략한 조건': 'Arrays and omitted conditions',
  'false와 undefined는 제외합니다. sx 배열은 한 단계 펼쳐 전달 순서를 유지합니다.':
    'Omit false and undefined; flatten one sx array level in order.',
  '배열로 전달한 강조 스타일': 'Emphasis passed as an array',
  '선택 항목 내보내기': 'Export selected items',
  '헤더를 가로에서 세로로': 'Change a header from row to column',
  '기본 가로 헤더와 responsiveHeaderLayoutStyle을 적용한 헤더를 비교합니다.':
    'Compare a row with responsiveHeaderLayoutStyle.',
  'action의 가로 스크롤': 'Horizontal action scrolling',
  '기본 줄바꿈 영역과 가로 스크롤 영역을 비교합니다. 버튼은 스크롤 영역에서 한 줄을 유지합니다.':
    'Compare wrapping with horizontal scrolling that keeps one button row.',
  '본문과 항목 크기': 'Body and item sizing',
  'responsiveBodyStyle과 item·stackItem 스타일로 본문을 콘텐츠 높이에 맞춥니다.':
    'Use body, item, and stackItem styles to fit content height.',
  '페이지 본문': 'Page content',
  '첫 번째 항목': 'First item',
  '두 번째 항목': 'Second item',
  '값 없음·빈 문자열·공백': 'Omitted, empty, and whitespace values',
  '인수를 생략하거나 빈 항목만 전달하면 빈 배열을 반환합니다.':
    'Omitted arguments and empty items return an empty array.',
  '앞뒤 공백과 빈 항목': 'Surrounding spaces and empty items',
  '각 항목의 앞뒤 공백을 제거하고 빈 문자열이 된 항목은 제외합니다.':
    'Trim each item and omit items that become empty strings.',
  '직접 입력과 중복 값': 'Custom input and duplicate values',
  '입력값을 바꿔 결과를 확인하세요. 같은 값이 여러 번 나와도 유지합니다.':
    'Edit the input. Repeated values are preserved.',
  '쉼표로 구분한 선택 값': 'Comma-separated selector values',
  '작업 시간과 최소 표시 시간에 따른 처리 중 안내를 비교합니다.':
    'Compare task and minimum durations for processing messages.',
  'interpolation과 defaultValue로 OWP namespace의 문구를 표시합니다.':
    'Use interpolation and defaultValue in the OWP namespace.',
  '활성 요소를 blur한 뒤 Dialog에 전달할 open 값을 반환합니다.':
    'Blur the active element before returning the Dialog open value.',
  'alert·confirm과 custom Dialog를 열고 Promise 결과를 확인합니다.':
    'Open alert, confirm, and custom dialogs and inspect their Promise results.',
  '기본 확인창과 안내·저장·수정·삭제용 helper를 비교합니다.':
    'Compare custom, info, save, update, and delete confirmations.',
  '미저장 변경을 확인한 뒤 지정한 action을 수행합니다.':
    'Check unsaved changes before running the specified action.',
  '헤더의 제목·slot·action이 한 줄에 들어가는지 측정합니다.':
    'Measure whether header title, slots, and actions fit on one line.',
  '실제 viewport의 width class와 device 상태를 확인합니다.':
    'Inspect the width class and device state of the current viewport.',
  '선택 값의 앞뒤 공백과 빈 항목을 제거해 배열로 반환합니다.':
    'Trim selector values and omit empty items in the result array.',
  '옵션 그룹을 병합하고 중복 value의 첫 항목을 유지합니다.':
    'Merge option groups while keeping the first option for each value.',
  'sx 객체·배열·조건부 스타일을 순서대로 병합합니다.':
    'Merge sx objects, arrays, and conditional styles in order.',
  'lg 미만에서 표 최소 너비와 가로 스크롤을 확인합니다.':
    'Inspect table minimum width and horizontal scrolling below lg.',
  '같은 표 행의 입력 도움말 높이를 보정합니다.':
    'Align input helper-text heights within the same table row.',
  'viewport에 따른 차트 프레임 높이와 overflow 동작을 비교합니다.':
    'Compare chart-frame height and overflow across viewport sizes.',
  '패널과 차트 프레임의 세로 배치 스타일을 적용합니다.':
    'Apply a vertical page layout for panels and chart frames.',
  '공개 반응형 스타일 값을 선택해 샘플 영역에 적용합니다.':
    'Select public responsive style values and apply them to a sample area.',
  '요청 시점의 boolean 또는 동기 getter로 dirty를 평가합니다.':
    'Evaluate dirty state from a boolean or synchronous getter at request time.',
  'controller의 요청을 구독하고 승인·취소를 직접 연결합니다.':
    'Subscribe to controller requests and connect approval and cancellation.',
  'MUI width class를 OWP device 이름으로 변환합니다.':
    'Convert a MUI width class into an OWP device name.',
  'device별 media query를 생성하고 현재 viewport와 비교합니다.':
    'Generate a media query for a device and match it to the current viewport.',
};
