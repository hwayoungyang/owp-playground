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
  'query는 DT를 FR_DATE·TO_DATE로 나누고, form은 두 날짜를 DT로 합칩니다. JSON 변환은 숫자·boolean을 문자열로 바꾸며, 이 예제는 요청 로그 필드를 제외합니다.':
    'query splits DT into FR_DATE and TO_DATE; form combines the two dates into DT. JSON conversion turns numbers and booleans into strings. This example excludes request log fields.',
  '날짜 범위를 선택하고 변환 버튼을 눌러 입력과 각 함수의 출력을 비교합니다.':
    'Select a date range and choose Transform to compare each function’s input and output.',
  변환: 'Transform',
  입력: 'Input',
  출력: 'Output',
  '변환 버튼을 눌러 주세요.': 'Select Transform.',
  '파일 업로드 데이터': 'File upload data',
  '파일 업로드 hook의 FormData 구성과 요청 변수 연결을 확인합니다.':
    'Inspect how the file upload hook prepares FormData and maps request variables.',
  '파일명 필드': 'Filename field',
  기본값: 'Default',
  '페이지와 테이블': 'Page and table',
  '직접 지정': 'Custom field',
  '업로드 payload 준비': 'Prepare an upload payload',
  '샘플 File과 추가 필드를 정규화한 뒤, useFormDataUploadMutation이 만든 FormData를 표에 표시합니다. 이 예제의 mutation은 미리보기만 수행하며 서버에 파일을 전송하지 않습니다.':
    'Normalize a sample File and extra fields, then display the FormData created by useFormDataUploadMutation. The mutation in this example only previews the payload and does not send files to a server.',
  '실제 업로드는 mutation을 앱의 API mutation으로 교체하고, createVariables에서 formData를 해당 API의 요청 변수에 연결합니다.':
    'For an actual upload, replace mutation with the app’s API mutation and map formData to its request variables in createVariables.',
  'payload 미리보기': 'Preview payload',
  필드: 'Field',
  값: 'Value',
  'payload 미리보기 버튼을 눌러 주세요.': 'Select Preview payload.',
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
