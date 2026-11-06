export const integrationsEnglish: Readonly<Record<string, string>> = {
  '패키지 실행 영역': 'Package workspace',
  '날짜·시간 선택': 'Date & time selection',
  '워크시트와 내보내기': 'Worksheets & export',
  '문서 생성과 다운로드': 'Document generation & download',
  '테마와 토큰 프리뷰': 'Theme & token preview',
  '포맷과 코드 생성': 'Formatting & code generation',
  '날짜·기간 선택': 'Date & range selection',
  'OwpDatePicker·OwpDateRangePicker·OwpWeekDatePicker로 단일 날짜, 시작·종료 기간, ISO 주차를 선택하고 포맷 문자열을 확인합니다.':
    'Select a single date, start-end range, and ISO week with OwpDatePicker, OwpDateRangePicker, and OwpWeekDatePicker, and inspect the formatted strings.',
  '시간·일시 선택': 'Time & date-time selection',
  'OwpTimePicker와 OwpTimeWheel로 24시간·오전/오후 시간과 통합 일시를 선택하고 간격 옵션을 비교합니다.':
    'Select 24-hour, AM/PM, and combined date-time values with OwpTimePicker and OwpTimeWheel, and compare step options.',
  '배열 데이터 내보내기': 'Array data export',
  'createExportDataToExcelBuffer와 exportExcelByBuffer로 헤더·접두사·접미사를 매핑해 xlsx 버퍼를 생성하고 다운로드합니다.':
    'Map headers, prefixes, and suffixes with createExportDataToExcelBuffer and exportExcelByBuffer to generate and download an xlsx buffer.',
  '셀·병합 서식 구성': 'Cell & merge styling',
  'loadExcelJSBrowser로 워크시트를 열고 setMergeCells·setCellValue·getLettersByIndex로 제목 병합과 셀 서식을 지정합니다.':
    'Open a worksheet with loadExcelJSBrowser and configure merged titles and cell styles with setMergeCells, setCellValue, and getLettersByIndex.',
  'PDF 문서 생성과 다운로드': 'PDF document generation & download',
  'Document·Page·View·Text·StyleSheet로 Helvetica 기반 요약 문서를 구성하고 renderPdfToBlob·downloadPdf로 생성·저장합니다.':
    'Compose a Helvetica-based summary document with Document, Page, View, Text, and StyleSheet, and render or download it with renderPdfToBlob and downloadPdf.',
  'SVG 도형 포함 리포트': 'Report with SVG shapes',
  'Svg·Rect·Line과 표 레이아웃을 조합해 지표 막대가 포함된 PDF 리포트 Blob을 생성하고 미리보기 정보를 확인합니다.':
    'Combine Svg, Rect, Line, and layout views to generate a PDF report Blob with metric bars and inspect the output.',
  '기본 테마와 다크 모드 프리뷰': 'Default themes & dark mode preview',
  'defaultThemes·changeThemeMode·getThemeWithButtonPaletteDefaults와 로컬 ThemeProvider로 light·dark 모드, primary 색상, radius 변경을 미리 봅니다.':
    'Preview light and dark modes, primary colors, and corner radius changes inside a local ThemeProvider using defaultThemes, changeThemeMode, and getThemeWithButtonPaletteDefaults.',
  'Table·DataGrid·DatePicker 토큰': 'Table, DataGrid & DatePicker tokens',
  'OwpThemeProvider에 table·dataGrid·datePicker 토큰을 전달하고 useTableTheme·useGridTheme·useDatePickerTheme으로 하위 컴포넌트에서 조회합니다.':
    'Pass table, dataGrid, and datePicker tokens to OwpThemeProvider and read them in descendant components with useTableTheme, useGridTheme, and useDatePickerTheme.',
  '숫자·문자열·폼 기본값 포맷': 'Number, string & form default formatting',
  'formatNumber·toFiniteNumber·getDisplayValue·getTrimmedValue·isNilOrEmptyString·getFormDefaultValues로 입력값을 정규화합니다.':
    'Normalize input values with formatNumber, toFiniteNumber, getDisplayValue, getTrimmedValue, isNilOrEmptyString, and getFormDefaultValues.',
  'QR 코드 Data URL 생성': 'QR code Data URL generation',
  'generateQrCodeDataUrl과 generateQrCodeUrl로 크기·여백·오류 정정 수준·색상 옵션을 적용한 QR 코드 이미지를 생성합니다.':
    'Generate QR code images with size, margin, error correction level, and color options using generateQrCodeDataUrl and generateQrCodeUrl.',

  // date-range-picker.tsx
  '단일 날짜와 연·월 선택': 'Single date and year-month selection',
  'OwpDatePicker로 일자(YYYY-MM-DD)와 연·월(YYYY-MM)을 선택하고 getTodayYmd로 오늘 날짜를 바로 채웁니다.':
    'Select a date (YYYY-MM-DD) and year-month (YYYY-MM) with OwpDatePicker, or fill today immediately with getTodayYmd.',
  '기준 일자': 'Reference date',
  '정산 연월': 'Settlement month',
  '오늘 날짜로 채우기': 'Fill with today',
  '기본 날짜 복원': 'Restore default dates',
  '시작·종료 기간 선택': 'Start and end range selection',
  'OwpDateRangePicker는 시작일과 종료일을 start,end 문자열로 반환하며 일자 범위와 월 범위를 모두 지원합니다.':
    'OwpDateRangePicker returns start and end dates as a start,end string and supports both date ranges and month ranges.',
  '조회 일자 범위': 'Date range',
  '조회 월 범위': 'Month range',
  'ISO 주차 선택과 반환값 비교': 'ISO week selection and return format comparison',
  'OwpWeekDatePicker는 ISO 주차 기준으로 주간을 선택하며 useYearWeekValue 옵션에 따라 YYYY-WW 또는 주차·날짜 문자열을 반환합니다.':
    'OwpWeekDatePicker selects an ISO week and returns either YYYY-WW or a week-and-date string depending on useYearWeekValue.',
  '목표 주차': 'Target week',
  'YYYY-WW 반환': 'Return YYYY-WW',
  'WW YYYY-MM-DD 반환': 'Return WW YYYY-MM-DD',
  '선택된 날짜와 기간 요약': 'Selected dates and ranges summary',
  구분: 'Category',
  컴포넌트: 'Component',
  '현재 반환값': 'Current return value',
  '단일 일자 / 연월': 'Single date / Year-month',
  '일자 범위 (시작 ~ 종료)': 'Date range (start ~ end)',
  '월 범위 (시작 ~ 종료)': 'Month range (start ~ end)',
  'ISO 주차': 'ISO week',

  // time-picker.tsx
  '24시간·오전/오후·초 단위 시간 선택': '24-hour, AM/PM & seconds time selection',
  'OwpTimePicker로 24시간제(HH:mm), 오전/오후 컬럼(useAmPm), 초 단위(HH:mm:ss)와 분·초 간격(timeSteps)을 설정합니다.':
    'Configure 24-hour (HH:mm), AM/PM column (useAmPm), seconds (HH:mm:ss), and minute/second intervals (timeSteps) with OwpTimePicker.',
  '24시간 선택 (HH:mm)': '24-hour selection (HH:mm)',
  '오전/오후 시간 선택': 'AM/PM time selection',
  '초 단위와 5분·10초 간격': 'Seconds with 5m / 10s step',
  '통합 일시 선택 (Date + Time)': 'Combined date & time selection',
  'OwpDatePicker에서 showTimePicker를 켜면 달력 하단에 타임 휠을 결합하고 onAccept로 선택된 날짜·시간 문자열을 받습니다.':
    'Enable showTimePicker on OwpDatePicker to attach a time wheel below the calendar and receive committed date-time strings via onAccept.',
  '예약 일시': 'Scheduled date & time',
  '현재 일시: {{current}} · 최근 확정(onAccept): {{accepted}}':
    'Current value: {{current}} · Last accepted (onAccept): {{accepted}}',
  '단독 OwpTimeWheel과 입력 파싱': 'Standalone OwpTimeWheel & input parsing',
  'OwpTimeWheel을 패널에 직접 배치하고 parseTimePickerInput으로 정규화된 시간 문자열을 확인합니다.':
    'Render OwpTimeWheel directly in a panel and inspect the normalized time string returned by parseTimePickerInput.',
  오전: 'AM',
  오후: 'PM',
  '오전 09:00:00': '09:00:00 AM',
  '오후 01:30:45': '01:30:45 PM',
  '시간 선택 상태 요약': 'Time selection summary',
  항목: 'Item',
  값: 'Value',
  '24시간 / 오전·오후 / 초 단위': '24-hour / AM·PM / Seconds',
  'OwpTimeWheel 정규화 값': 'OwpTimeWheel normalized value',
  '최근 조작 컬럼': 'Last interacted column',

  // data-export.tsx
  '고속 포장 설비': 'High-speed packaging unit',
  '비전 검사 모듈': 'Vision inspection module',
  '자동 분류 컨베이어': 'Automated sorting conveyor',
  '라인 코드': 'Line code',
  설비명: 'Equipment',
  '처리 수량': 'Processed units',
  가동률: 'Utilization',
  예산: 'Budget',
  건: ' units',
  '파일명을 입력한 뒤 다시 시도해 주세요.': 'Enter a file name and try again.',
  'Excel 버퍼를 생성하지 못했습니다. 다시 시도해 주세요.':
    'Could not generate the Excel buffer. Please try again.',
  '매퍼 설정과 Excel 버퍼 생성': 'Mapper configuration & Excel buffer generation',
  'createExportDataToExcelBuffer에 ExcelHeader와 ExcelDataMapper(prefix·suffix)를 전달해 xlsx 버퍼를 만들고 exportExcelByBuffer로 저장합니다.':
    'Pass ExcelHeader and ExcelDataMapper (prefix and suffix) to createExportDataToExcelBuffer to build an xlsx buffer and save it with exportExcelByBuffer.',
  '내보낼 파일명': 'Export file name',
  '특수문자는 안전한 파일명으로 정규화됩니다.':
    'Special characters are normalized into a safe file name.',
  '원화 접두사 (₩)': 'KRW prefix (₩)',
  '달러 접두사 ($)': 'USD prefix ($)',
  '단위 접미사 포함': 'Include unit suffix',
  '단위 접미사 제외': 'Omit unit suffix',
  '버퍼 생성 확인': 'Verify buffer generation',
  'Excel 다운로드': 'Download Excel',
  '브라우저 다운로드 실행': 'Browser download triggered',
  '버퍼 검증 완료': 'Buffer verified',
  '생성 완료: {{name}}.xlsx ({{bytes}} bytes · {{mode}})':
    'Generated: {{name}}.xlsx ({{bytes}} bytes · {{mode}})',
  '매핑된 워크시트 데이터 미리보기': 'Mapped worksheet data preview',
  'ExcelDataMapper가 각 행의 속성에 접두사와 접미사를 적용해 셀에 기록하는 결과를 미리 확인합니다.':
    'Preview how ExcelDataMapper applies prefixes and suffixes to each row before writing cells.',
  '매핑된 워크시트 행': 'Mapped worksheet rows',

  // cell-merge-style.tsx
  '스카이 블루 강조': 'Sky blue highlight',
  '앰버 강조': 'Amber highlight',
  '에메랄드 강조': 'Emerald highlight',
  '병합 제목을 입력한 뒤 다시 시도해 주세요.': 'Enter a merged title and try again.',
  '점검 대상': 'Inspection target',
  '측정 결과': 'Measurement result',
  '공정 코드': 'Process code',
  측정치: 'Measured value',
  판정: 'Verdict',
  '장력 편차': 'Tension variance',
  '온도 안정성': 'Temperature stability',
  적합: 'Pass',
  '워크시트 서식을 구성하지 못했습니다. 다시 시도해 주세요.':
    'Could not configure worksheet styles. Please try again.',
  '병합 헤더와 셀 서식 구성': 'Merged headers & cell styling',
  'loadExcelJSBrowser로 워크시트를 생성하고 setMergeCells와 setCellValue로 다단 병합 헤더와 강조 셀 배경을 설정합니다.':
    'Create a worksheet with loadExcelJSBrowser and configure multi-row merged headers and highlighted cell backgrounds with setMergeCells and setCellValue.',
  'A1:D1 병합 제목': 'A1:D1 merged title',
  '워크시트 버퍼 생성': 'Build worksheet buffer',
  '서식 적용 Excel 다운로드': 'Download styled Excel',
  '워크시트 버퍼 크기: {{bytes}} bytes · 병합 범위: {{ranges}} · 강조 ARGB: {{argb}}':
    'Worksheet buffer size: {{bytes}} bytes · Merged ranges: {{ranges}} · Highlight ARGB: {{argb}}',
  '컬럼 인덱스·문자 변환 확인': 'Column index & letter conversion',
  'getLettersByIndex와 getIndexByLetters로 1 기반 컬럼 번호와 Excel 열 문자(A~Z, AA~)를 양방향 변환합니다.':
    'Convert between 1-based column numbers and Excel column letters (A–Z, AA–) using getLettersByIndex and getIndexByLetters.',
  '컬럼 {{index}} ({{letter}})': 'Column {{index}} ({{letter}})',
  '병합 범위와 컬럼 변환 결과': 'Merged ranges and column conversion results',
  '사용 API': 'API used',
  결과: 'Result',
  '상단 제목·그룹 병합': 'Top title & group merges',
  '판정 셀 배경 서식': 'Verdict cell fill style',
  '컬럼 번호 ↔ 열 문자': 'Column index ↔ column letter',

  // document-download.tsx
  '다운로드할 PDF 파일명을 입력해 주세요.': 'Enter a PDF file name to download.',
  'PDF 문서를 생성하지 못했습니다. 다시 시도해 주세요.':
    'Could not generate the PDF document. Please try again.',
  'Helvetica 기반 PDF 생성과 다운로드': 'Helvetica-based PDF generation & download',
  'Page style에 표준 폰트(Helvetica)를 지정해 외부 폰트 네트워크 요청 없이 브라우저에서 즉시 PDF Blob을 렌더링하고 downloadPdf로 저장합니다.':
    'Specify the standard Helvetica font on Page style to render a PDF Blob directly in the browser without external font requests, and save it with downloadPdf.',
  '문서 제목 (ASCII)': 'Document title (ASCII)',
  '참조 번호 (ASCII)': 'Reference code (ASCII)',
  '저장 파일명': 'Save file name',
  'PDF Blob 생성': 'Generate PDF Blob',
  'PDF 바로 다운로드': 'Download PDF directly',
  '생성된 Blob URL 저장': 'Save generated Blob URL',
  'PDF 생성 완료: {{title}} · {{size}} bytes ({{type}})':
    'PDF generated: {{title}} · {{size}} bytes ({{type}})',
  '문서 본문 항목 미리보기': 'Document line items preview',
  'Document·Page·View·Text 레이아웃으로 PDF에 기록되는 명세 항목과 생성된 Blob 정보입니다.':
    'Line items and Blob metadata written to the PDF using Document, Page, View, and Text.',
  'PDF 문서 항목': 'PDF document items',
  코드: 'Code',
  내역: 'Description',
  금액: 'Amount',

  // vector-summary.tsx
  '3분기 가동 지표 (Q3)': 'Q3 operation metrics',
  '4분기 목표 지표 (Q4)': 'Q4 target metrics',
  'SVG 리포트 PDF를 생성하지 못했습니다. 다시 시도해 주세요.':
    'Could not generate the SVG report PDF. Please try again.',
  'SVG 막대 도형이 포함된 KPI PDF 리포트': 'KPI PDF report with SVG bar shapes',
  'Svg·Rect·Line 컴포넌트로 PDF 페이지 안에 벡터 막대 그래프를 그리고 renderPdfToBlob으로 생성된 Object URL을 관리합니다.':
    'Draw vector bar charts inside a PDF page with Svg, Rect, and Line, and manage the Object URL created from renderPdfToBlob.',
  '벡터 리포트 PDF 생성': 'Generate vector report PDF',
  '리포트 PDF 다운로드': 'Download report PDF',
  '생성된 벡터 PDF: {{period}} · {{size}} bytes':
    'Generated vector PDF: {{period}} · {{size}} bytes',
  '벡터 리포트 KPI 지표': 'Vector report KPI metrics',
  지표명: 'Metric',
  달성률: 'Score',
  'SVG Rect 너비 (240px 기준)': 'SVG Rect width (of 240px)',
  색상: 'Color',

  // theme-mode-preview.tsx
  '모드·Primary·Radius 로컬 테마 프리뷰': 'Local theme preview for Mode, Primary & Radius',
  'getThemeWithButtonPaletteDefaults와 changeThemeMode로 light·dark 팔레트를 계산하고 로컬 ThemeProvider 안에서만 primary 색상과 모서리 반경(borderRadius)을 미리 봅니다.':
    'Compute light and dark palettes with getThemeWithButtonPaletteDefaults and changeThemeMode, and preview primary colors and borderRadius inside a local ThemeProvider.',
  'Light 모드': 'Light mode',
  'Dark 모드': 'Dark mode',
  'Radius {{radius}}px': 'Radius {{radius}}px',
  '로컬 테마 프리뷰 카드': 'Local theme preview card',
  '앱 전체 테마를 바꾸지 않고 하위 영역에만 테마 옵션을 적용합니다.':
    'Applies theme options only to this subtree without changing the app shell theme.',
  '프리뷰 입력 필드': 'Preview input field',
  'Primary 액션': 'Primary action',
  'Secondary 액션': 'Secondary action',
  '계산된 팔레트와 기본 옵션 확인': 'Resolved palette & default options',
  'changeThemeMode, getThemeWithButtonPaletteDefaults, extendThemeWithMixins가 반환한 값을 표로 확인합니다.':
    'Inspect the values returned by changeThemeMode, getThemeWithButtonPaletteDefaults, and extendThemeWithMixins.',
  '테마 계산 결과': 'Resolved theme values',
  '토큰 경로': 'Token path',
  '현재 값': 'Current value',

  // surface-tokens.tsx
  '오션 블루 토큰': 'Ocean blue tokens',
  '슬레이트 그레이 토큰': 'Slate gray tokens',
  '틸 그린 토큰': 'Teal green tokens',
  'OwpThemeProvider 하위 샘플 헤더': 'Sample header under OwpThemeProvider',
  '행 hover 배경 토큰': 'Row hover background token',
  'DatePicker 선택 배경': 'DatePicker selected background',
  '하위 Hook에서 조회한 테마 토큰': 'Theme tokens read by descendant Hooks',
  '조회 Hook / 유틸': 'Hook / utility',
  '토큰 속성': 'Token property',
  '해석된 값': 'Resolved value',
  'OwpThemeProvider 토큰 상속과 Hook 조회': 'OwpThemeProvider token inheritance & Hook lookup',
  'OwpThemeProvider에 table·dataGrid·datePicker 설정을 주입하고 하위 컴포넌트에서 useTableTheme·useGridTheme·useDatePickerTheme으로 토큰을 읽습니다.':
    'Provide table, dataGrid, and datePicker settings to OwpThemeProvider and read the tokens in a child component with useTableTheme, useGridTheme, and useDatePickerTheme.',
  '상위 Provider를 생략한 토큰은 기본 테마 토큰과 자동 병합됩니다.':
    'Tokens omitted from the provider are merged automatically with the default theme tokens.',

  // value-format.tsx
  '소수 포함 숫자 (1284500.456)': 'Decimal number (1284500.456)',
  '천 단위 문자열 (48,200)': 'Grouped string (48,200)',
  '빈 문자열 ("")': 'Empty string ("")',
  '비숫자 텍스트 ("N/A")': 'Non-numeric text ("N/A")',
  '점(.) 경로 키 병합': 'Merge dot-path keys',
  '일부 필드만 전달': 'Partial fields only',
  '숫자·문자열 포맷과 공백·빈 값 처리': 'Number & string formatting and empty value handling',
  'getTrimmedValue·isNilOrEmptyString·toFiniteNumber·formatNumber·getDisplayValue로 사용자 입력과 빈 값을 일관되게 정규화합니다.':
    'Normalize user input and empty values consistently with getTrimmedValue, isNilOrEmptyString, toFiniteNumber, formatNumber, and getDisplayValue.',
  '원본 입력값': 'Raw input value',
  '빈 값 대체 표시 문자': 'Empty display fallback',
  '소수 자릿수 {{digits}}자리': '{{digits}} fraction digits',
  '숫자·문자열 변환 결과': 'Number and string conversion results',
  함수: 'Function',
  '반환 결과': 'Return value',
  '폼 초기값 병합 (getFormDefaultValues)': 'Merge form default values (getFormDefaultValues)',
  'getFormDefaultValues는 서버 초기값의 점(.) 구분 접두사를 제거하고 폼 기본값에 정의된 키만 안전하게 병합합니다.':
    'getFormDefaultValues strips dot-separated prefixes from server initial values and merges only keys defined in the form defaults.',
  '폼 기본값 병합 결과': 'Merged form default values',
  '필드 키': 'Field key',
  기본값: 'Default value',
  '병합된 값': 'Merged value',

  // qrcode-generator.tsx
  '슬레이트 (#0f172a / #ffffff)': 'Slate (#0f172a / #ffffff)',
  '오션 블루 (#0369a1 / #f0f9ff)': 'Ocean blue (#0369a1 / #f0f9ff)',
  '에메랄드 (#065f46 / #ecfdf5)': 'Emerald (#065f46 / #ecfdf5)',
  'QR 코드로 변환할 텍스트를 입력해 주세요.': 'Enter text to encode as a QR code.',
  'QR 코드 이미지를 생성하지 못했습니다. 다시 시도해 주세요.':
    'Could not generate the QR code image. Please try again.',
  'QR 코드 이미지 Data URL 생성': 'Create a QR code data URL',
  'generateQrCodeDataUrl과 generateQrCodeUrl로 너비·여백·오류 정정 수준(L/M/Q/H)·색상 옵션을 지정해 QR 코드 Data URL을 생성합니다.':
    'Generate a QR code Data URL with width, margin, error correction level (L/M/Q/H), and color options using generateQrCodeDataUrl and generateQrCodeUrl.',
  'QR 코드 텍스트·URL': 'QR code text or URL',
  '여백 {{margin}}': 'Margin {{margin}}',
  '정정 수준 {{level}}': 'Level {{level}}',
  'PNG 다운로드': 'Download PNG',
  '생성된 QR 코드 이미지': 'Generated QR code image',
  '현재 인코딩 데이터: {{payload}}': 'Encoded payload: {{payload}}',
  'QR 코드 생성 메타데이터': 'QR code metadata',
  '크기 / 여백 / 정정 수준': 'Size / Margin / Error correction',
  '시간 선택 (24시간제·12시간제)': 'Time selection (24-hour / 12-hour)',
  '24시간제와 12시간제의 시간 입력·날짜와 시간 선택·시간 휠을 각각 비교합니다.':
    'Compare time input, date-time selection, and time wheels in 24-hour and 12-hour modes.',
  '24시간제': '24-hour mode',
  '12시간제': '12-hour mode',
  '오전·오후를 선택하는 12시간제입니다. 입력과 선택창에서 같은 시간의 표시를 비교해 주세요.':
    'Choose AM or PM in 12-hour mode. Compare how the same time appears in the input and picker.',
  '00시부터 23시까지 선택하는 24시간제입니다. 시·분·초를 각각 선택해 주세요.':
    'Choose hours from 00 to 23 in 24-hour mode. Select hours, minutes, and seconds independently.',
  '{{mode}} 시간': '{{mode}} time',
  '{{mode}} 날짜와 시간': '{{mode}} date and time',
  '날짜와 시간의 선택창은 각 모드를 따르며, 일시 반환값은 YYYY-MM-DD HH:mm:ss 형식입니다.':
    'The date-time picker uses the selected clock mode. Its return value is formatted as YYYY-MM-DD HH:mm:ss.',
  '{{mode}} 시간 휠': '{{mode}} time wheel',
  '시간 휠': 'Time wheel',
  시: 'Hours',
  분: 'Minutes',
  초: 'Seconds',
  '오전/오후': 'AM/PM',
  '선택한 시간: {{value}}': 'Selected time: {{value}}',
  '휠 반환값: {{value}}': 'Wheel value: {{value}}',
  '선택한 날짜·시간: {{value}}': 'Confirmed date and time: {{value}}',
  '날짜·연월·기간·주차를 선택하고 반환값을 확인합니다.':
    'Choose dates, months, ranges, and weeks and inspect their return values.',
  '배열 데이터에 prefix·suffix를 적용하고 Excel 파일로 내보냅니다.':
    'Add prefixes and suffixes to array data and export an Excel file.',
  '제목 셀을 병합하고 배경색을 바꾼 Excel 파일을 생성합니다.':
    'Merge title cells, change cell backgrounds, and generate an Excel file.',
  '제목과 참조 번호를 입력해 PDF 파일을 생성하고 다운로드합니다.':
    'Enter a title and reference number to generate and download a PDF.',
  '지표를 선택해 막대 그래프가 포함된 PDF 리포트를 생성합니다.':
    'Choose metrics to generate a PDF report with a bar chart.',
  '밝기·primary 색상·radius를 바꾸고 하위 화면에만 적용되는 테마를 확인합니다.':
    'Change mode, primary color, and radius in a local theme preview.',
  'Table·DataGrid·DatePicker의 테마 토큰을 바꾸고 적용값을 확인합니다.':
    'Change Table, DataGrid, and DatePicker theme tokens and inspect the applied values.',
  '숫자와 문자열의 변환 결과를 확인하고 폼 기본값을 병합합니다.':
    'Inspect number and string transformations and merge form defaults.',
  '텍스트·크기·색상을 바꾸고 QR 코드 이미지를 생성합니다.':
    'Change text, size, and colors to generate a QR code image.',
  '테마 설정': 'Theme settings',
  'SVG 벡터 그래프와 PDF': 'SVG vector chart and PDF',
  'SVG 그래프를 확대해 보고, 같은 지표가 담긴 PDF를 생성합니다.':
    'Zoom in on an SVG chart and generate a PDF using the same metrics.',
  '컴포넌트별 테마 설정': 'Component theme settings',
  '색상을 선택해 Table·DataGrid·DatePicker의 테마 적용 결과를 확인합니다.':
    'Choose a color to preview theme settings for Table, DataGrid, and DatePicker.',
  'QR 코드 생성': 'Generate QR code',
  '바코드 생성': 'Generate barcode',
  '텍스트·형식·높이를 바꾸고 바코드 이미지를 생성합니다.':
    'Change text, format, and height to generate a barcode image.',
  'SVG 미리보기': 'SVG preview',
  '{{period}} 벡터 막대 그래프': '{{period}} vector bar chart',
  '벡터는 점과 선으로 그린 도형입니다. 200%로 확대해도 윤곽이 선명하며, PDF에도 같은 지표를 SVG 도형으로 그립니다.':
    'Vector graphics use points and lines. Edges stay sharp at 200% zoom. The PDF draws the same metrics as SVG shapes.',
  '오션 블루': 'Ocean blue',
  '슬레이트 그레이': 'Slate gray',
  '틸 그린': 'Teal green',
  '상품 목록': 'Product list',
  사과: 'Apple',
  '선택한 날짜': 'Selected date',
  '색상과 radius를 미리 봅니다. Table·DataGrid의 행에 마우스를 올려 배경색도 확인하세요.':
    'Preview colors and radius. Hover over Table and DataGrid rows to see the background color.',
  'Excel 파일 생성': 'Generate Excel file',
  '내보낼 데이터': 'Export data',
  'PDF 생성': 'Generate PDF',
  '생성한 PDF 저장': 'Save generated PDF',
  '문서 내용': 'Document contents',
  '생성 정보': 'Generation details',
  '날짜와 시간 (선택창: {{mode}})': 'Date and time (popup: {{mode}})',
  '날짜·시간 입력과 반환값은 24시간 형식입니다. 선택창에서는 위 모드에 따라 오전·오후를 표시합니다.':
    'Date and time inputs and return values use 24-hour format. The popup shows AM/PM according to the mode above.',
  '스카이 블루': 'Sky blue',
  '다크 그레이': 'Dark gray',
  에메랄드: 'Emerald',
  인디고: 'Indigo',
  '워크시트 미리보기': 'Worksheet preview',
  '시간 선택 (24h · 12h)': 'Time selection (24h · 12h)',
  '24h·12h 표기로 시간 입력과 휠을 비교합니다.':
    'Compare time inputs and wheels in 24h and 12h formats.',
  '오전·오후로 구분합니다. 입력과 휠에서 같은 시간을 확인하세요.':
    'Uses AM and PM. Check the same time in the input and wheel.',
  '00:00부터 23:59까지 표시합니다. 시·분·초를 선택하세요.':
    'Displays 00:00 to 23:59. Select hours, minutes, and seconds.',
  '시간 ({{mode}})': 'Time ({{mode}})',
  '컴포넌트 / API': 'Component / API',
  '테마 설정 결과': 'Theme settings result',
  모드: 'Mode',
  '단위 suffix': 'Unit suffix',
  강조색: 'Highlight color',
  '확대 비율': 'Zoom',
  '리포트 지표': 'Report metrics',
  '컴포넌트별 테마 설정 결과': 'Component theme settings result',
  'Table 헤더': 'Table header',
  'DataGrid 헤더': 'DataGrid header',
  '테마 색상': 'Theme color',
  '그래프 지표': 'Chart metrics',
  앰버: 'Amber',
  '생성 파일': 'Generated file',
  '실행한 동작': 'Action',
  '병합 범위': 'Merged ranges',
  'Tailwind 설정 결과': 'Tailwind settings result',
  '열 배치': 'Columns',
  '기본 1열 · 960px 이상 3열': 'One column by default · three at 960px and above',
  '1열': 'One column',
  '선택 없음': 'No selection',
  '표시 값': 'Display value',
  '날짜 선택 결과': 'Date selection result',
  '선택한 날짜·시간': 'Selected date and time',
  '{{period}} {{time}}': '{{time}} {{period}}',
  '{{date}} {{time}}': '{{date}} {{time}}',
  '입력과 반환값은 24h입니다. 선택창은 오전·오후로 표시합니다.':
    'Inputs and return values use 24h. The popup uses AM and PM.',
  '텍스트 표시': 'Show text',
  '바코드를 생성하고 있습니다.': 'Generating barcode.',
  '바코드 데이터를 입력해 주세요.': 'Enter barcode data.',
  '바코드 생성 결과': 'Barcode result',
  'QR 코드를 생성하고 있습니다.': 'Generating QR code.',
  'QR 코드 텍스트를 입력해 주세요.': 'Enter QR code text.',
  'QR 코드 생성 결과': 'QR code result',
  '값 변환 예제': 'Value conversion examples',
  숫자·문자열: 'Numbers and strings',
  '폼 기본값': 'Form defaults',
  '입력 예시': 'Sample input',
  '직접 입력': 'Custom input',
  '{{digits}}자리': '{{digits}} digits',
  '숫자 포맷': 'Number format',
  표시값: 'Display value',
  미리보기: 'Preview',
  '반환 형식': 'Return format',
  '파일 크기': 'File size',
  'PDF 다운로드': 'Download PDF',
  '문서 제목': 'Document title',
  형식: 'Format',
  '3분기': 'Q3',
  '4분기': 'Q4',
  '테마 모드': 'Theme mode',
  '색상 테마': 'Color theme',
  '추가 옵션': 'More options',
  여백: 'Margin',
  '정정 수준': 'Error correction',
  간격: 'Spacing',
  '컬럼 번호': 'Column number',
};
