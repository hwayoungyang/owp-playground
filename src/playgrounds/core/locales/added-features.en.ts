export const addedFeaturesEnglish: Readonly<Record<string, string>> = {
  '날짜 범위': 'Date range',
  '요청 파라미터': 'Request parameters',
  '날짜 범위와 JSON 값을 API 요청 형식으로 변환하고 입력·출력을 비교합니다.':
    'Convert date ranges and JSON values into API request parameters and compare inputs and outputs.',
  '날짜 변환 방향': 'Date conversion direction',
  'JSON key 접두사': 'JSON key prefix',
  없음: 'None',
  'STATUS에도 접두사 적용': 'Prefix STATUS too',
  'null 유지': 'Preserve null',
  'query 모드에서는 DT를 FR_DATE·TO_DATE로 나누고, form 모드에서는 두 날짜를 DT로 합칩니다. JSON 변환은 숫자·boolean을 문자열로 바꾸며, 이 예제에서는 요청 로그 필드를 제외합니다.':
    'query splits DT into FR_DATE and TO_DATE; form combines the two dates into DT. JSON conversion turns numbers and booleans into strings. This example excludes request log fields.',
  '날짜 범위를 선택하고 변환 버튼을 눌러 입력과 각 함수의 출력을 비교합니다.':
    'Select a date range and choose Transform to compare each function’s input and output.',
  변환: 'Transform',
  입력: 'Input',
  출력: 'Output',
  '변환 버튼을 눌러 주세요.': 'Select Transform.',
  '파일 업로드': 'File upload',
  '로컬 파일을 선택하고 업로드 요청의 FormData를 확인합니다.':
    'Select a local file and inspect the FormData for an upload request.',
  '파일명 필드': 'Filename field',
  기본값: 'Default',
  '페이지와 테이블': 'Page and table',
  '직접 지정': 'Custom field',
  '파일 선택과 요청 미리보기': 'Select a file and preview the request',
  '로컬 파일 하나를 선택하고 추가하면 업로드 요청의 FormData를 확인할 수 있습니다. 요청은 로컬에서만 미리 보며 서버에 전송하지 않습니다.':
    'Select one local file and choose Add to inspect the upload request’s FormData. The request is previewed locally and is not sent to a server.',
  '파일 선택': 'Select file',
  '파일 추가': 'Add file',
  '파일 선택을 취소했습니다.': 'File selection was canceled.',
  '선택한 파일: {{name}} · {{size}}바이트 · MIME: {{type}}':
    'Selected file: {{name}} · {{size}} bytes · MIME: {{type}}',
  '알 수 없음': 'Unknown',
  '선택한 파일이 없습니다. 파일 선택 버튼으로 로컬 파일을 선택해 주세요.':
    'No file selected. Choose Select file to pick a local file.',
  '파일을 추가했습니다. 아래 표에서 FormData에 담긴 필드를 확인하세요.':
    'File added. Inspect the FormData fields in the table below.',
  'file에는 선택한 파일의 바이너리가 담깁니다. 표에는 파일 내용 대신 이름·크기·MIME을 표시하며, 나머지 행은 함께 전달되는 파일명과 추가 필드입니다.':
    'file contains the selected file’s binary data. The table shows its name, size, and MIME type instead of its contents; the other rows are the filename and additional fields sent with it.',
  '실제 업로드는 mutation을 앱의 API mutation으로 교체하고, createVariables에서 formData를 해당 API의 요청 변수에 연결합니다.':
    'For an actual upload, replace mutation with the app’s API mutation and map formData to its request variables in createVariables.',
  필드: 'Field',
  값: 'Value',
  '추가 버튼을 눌러 선택한 파일의 FormData를 확인하세요.':
    'Choose Add to inspect the selected file’s FormData.',
  '파일을 선택한 뒤 추가 버튼을 눌러 주세요.': 'Select a file, then choose Add.',
  '기본 파일명 필드는 FILE_NAME입니다. PAGEID·TABLENAME을 함께 전달하면 ITEM_ATTACHMENT가 되고, 직접 지정하면 ORIGINAL_NAME을 사용합니다.':
    'The default filename field is FILE_NAME. Passing PAGEID and TABLENAME together produces ITEM_ATTACHMENT in this example; choosing a custom field uses ORIGINAL_NAME.',
  '로컬 Blob 파일을 ZIP으로 묶어 다운로드합니다.':
    'Bundle local Blob files into a ZIP archive and download it.',
  '로컬 텍스트 두 개를 Blob으로 만들고 saveZipFile로 core-files.zip을 다운로드합니다. 파일명은 items.csv·readme.txt로 유지하며, 저장 여부는 브라우저 다운로드 목록에서 확인합니다.':
    'Create Blobs from two local text samples and download core-files.zip with saveZipFile. Keep the names items.csv and readme.txt, and check your browser’s download list to confirm the save.',
  'ZIP 다운로드': 'Download ZIP',
  파일명: 'Filename',
  '파일 내용': 'File content',
  'ZIP 파일을 만들고 있습니다.': 'Creating the ZIP archive.',
  'ZIP 파일을 만들지 못했습니다. 다시 시도해 주세요.':
    'Could not create the ZIP archive. Try again.',
  'ZIP 다운로드 버튼을 눌러 주세요.': 'Select Download ZIP.',
};
