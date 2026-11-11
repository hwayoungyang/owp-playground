export const packageGuidesEnglish = {
  'hasValue와 빈 값 판정': 'hasValue and empty values',
  '원본 값의 타입을 보존하며 빈 값을 판정하고 배열을 필터링합니다.':
    'Check for empty values and filter arrays while preserving original types.',
  '원본 값과 타입': 'Original values and types',
  "@owp/utils의 hasValue는 null, undefined, 빈 문자열('')에만 false를 반환합니다. 숫자 0, boolean false, 공백 문자열과 NaN에는 true를 반환하며, isNilOrEmptyString과 반대 결과입니다. 문자열 '0'과 'false'는 숫자·boolean과 다른 값입니다.":
    "hasValue from @owp/utils returns false only for null, undefined, and the empty string (''). It returns true for the number 0, the boolean false, whitespace strings, and NaN, giving the opposite result to isNilOrEmptyString. The strings '0' and 'false' are different from numbers and booleans.",
  '배열 필터와 공백 처리': 'Array filtering and whitespace',
  "array.filter(hasValue)는 null, undefined, 빈 문자열을 제외하고 0과 false를 유지합니다. type guard는 Exclude<T, null | undefined | ''>로 타입을 좁힙니다. 공백 문자열도 제외하려면 먼저 getTrimmedValue로 문자열을 변환한 뒤 판정해야 합니다. 원본 판정과 trim 후 판정은 서로 다른 연산입니다.":
    "array.filter(hasValue) removes null, undefined, and empty strings while retaining 0 and false. Its type guard narrows to Exclude<T, null | undefined | ''>. To remove whitespace strings as well, first transform the string with getTrimmedValue, then check it. Checking the original value and checking the trimmed value are separate operations.",
  'KST 날짜·시간 유틸': 'KST date and time utilities',
  'Unix 밀리초를 KST로 표시하고 날짜 조정·자정·엄격한 파싱을 확인합니다.':
    'Format Unix milliseconds in KST and inspect date adjustments, midnight, and strict parsing.',
  '공개 import와 밀리초 단위': 'Public imports and milliseconds',
  '@owp/date-picker/utils에서 KST 함수와 type-only KstDateOptions를 import합니다. timestamp는 Unix 밀리초입니다. formatKstDateTime의 기본 포맷은 YYYY-MM-DD HH:mm:ss이며 Z는 +09:00, ZZ는 +0900을 표시합니다. 기존 formatDate·formatToday의 로컬 날짜 처리와 picker의 기본 동작은 유지됩니다.':
    'Import the KST functions and the type-only KstDateOptions from @owp/date-picker/utils. Timestamps are Unix milliseconds. formatKstDateTime defaults to YYYY-MM-DD HH:mm:ss; Z displays +09:00 and ZZ displays +0900. Existing local-date handling in formatDate and formatToday and the default picker behavior remain unchanged.',
  '같은 시각의 날짜·시간과 자정': 'Date, time, and midnight for one instant',
  'getKstToday(format, timestamp)의 기본 포맷은 YYYY-MM-DD, getKstCurrentTime(format, timestamp)은 HH:mm:ss입니다. getKstCurrentDateTime(timeFormat, timestamp)은 같은 timestamp의 { date, time }을 반환하며 date는 YYYY-MM-DD입니다. timestamp를 생략하면 현재 시각을 사용합니다. getKstDayStart(timestamp)는 해당 KST 날짜의 자정을 실제 epoch 밀리초로 반환합니다. 2026-01-31의 KST 자정은 1769785200000이며 UTC로는 2026-01-30T15:00:00.000Z입니다.':
    'getKstToday(format, timestamp) defaults to YYYY-MM-DD, and getKstCurrentTime(format, timestamp) defaults to HH:mm:ss. getKstCurrentDateTime(timeFormat, timestamp) returns { date, time } for the same timestamp, with date in YYYY-MM-DD format. Omitting timestamp uses the current instant. getKstDayStart(timestamp) returns the actual epoch milliseconds for midnight on that KST date. Midnight on 2026-01-31 in KST is 1769785200000, or 2026-01-30T15:00:00.000Z in UTC.',
  '월말 보정과 날짜 이동 순서': 'Month-end clamping and adjustment order',
  'getKstDate(options, timestamp)는 KST에서 months → days → startOfMonth 순서로 적용하고 YYYY-MM-DD를 반환합니다. KstDateOptions의 기본값은 months=0, days=0, startOfMonth=false입니다. 월 이동 시 없는 날짜는 대상 월의 말일로 보정하고 days는 Math.round로 반올림합니다. 2026-01-31에서 months=1이면 2026-02-28, 이어 days=1이면 2026-03-01이며 startOfMonth는 마지막으로 적용됩니다. 호스트 시간대와 DST에 영향을 받지 않도록 UTC 달력으로 계산합니다.':
    'getKstDate(options, timestamp) applies months → days → startOfMonth in KST and returns YYYY-MM-DD. KstDateOptions defaults to months=0, days=0, startOfMonth=false. Month shifts clamp missing dates to the last day of the target month; days is rounded with Math.round. Starting on 2026-01-31, months=1 produces 2026-02-28, then days=1 produces 2026-03-01; startOfMonth is applied last. Calculations use the UTC calendar to avoid host time zone and DST effects.',
  '엄격한 파싱과 null': 'Strict parsing and null',
  'parseKstDateTime은 앞뒤 공백을 제거한 YYYY-MM-DD 또는 YYYY-MM-DD[단일 공백/대문자 T]HH:mm[:ss[.S~SSS]]를 받습니다. 날짜만 있으면 KST 자정, 시간대가 없는 날짜·시간은 KST로 해석합니다. 시간이 있으면 대문자 Z 또는 ±HH:mm/±HHmm을 붙일 수 있으며 offset은 시 00~23, 분 00~59입니다. 밀리초 1~3자리는 초가 있을 때만 허용합니다. 잘못된 날짜·시간·offset, 소문자 t/z, 여러 공백, 4자리 이상 밀리초, 빈 입력과 지원하지 않는 형식은 null을 반환합니다. 실패를 0이나 현재 시각으로 바꾸지 않습니다.':
    'parseKstDateTime trims leading and trailing whitespace and accepts YYYY-MM-DD or YYYY-MM-DD[single space/uppercase T]HH:mm[:ss[.S~SSS]]. A date alone means midnight in KST; a date and time without a time zone is interpreted as KST. A time may end with uppercase Z or ±HH:mm/±HHmm, with offset hours 00–23 and minutes 00–59. Fractions of 1–3 digits require seconds. Invalid dates, times, or offsets, lowercase t/z, multiple separator spaces, fractions of 4 or more digits, empty input, and unsupported formats return null. Do not replace failure with 0 or the current time.',
  '실행 예제에서 확인하기': 'Try the executable example',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 React UI 컴포넌트, 스타일과 실행 리소스를 제공하는 패키지입니다.':
    'A package providing React UI components, styles and runtime resources for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 재사용하는 MUI 컴포넌트와 공통 UI 기능을 제공하는 패키지입니다.':
    'A package providing reusable MUI components and shared UI features for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 차트 구현에 사용하는 React 컴포넌트를 제공하는 패키지입니다.':
    'A package providing React chart components for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 날짜·시간 입력 컴포넌트와 Dayjs 설정을 제공하는 패키지입니다.':
    'A package providing date and time input components and Dayjs configuration for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 ExcelJS loader, OWP workbook 계약, 셀 서식과 Excel 유틸을 제공하는 패키지입니다.':
    'A package providing an ExcelJS loader, OWP workbook contracts, cell formatting and Excel utilities for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 PDF 컴포넌트, 타입, 폰트 등록과 렌더링 유틸을 제공하는 패키지입니다.':
    'A package providing PDF components, types, font registration and rendering utilities for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 테마 계약과 기본값을 제공하는 패키지입니다.':
    'A package providing theme contracts and defaults for application development and SI projects at IMPIX Corporation.',
  '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 사용하는 공통 유틸리티 패키지입니다. 숫자 변환과 포맷팅, 문자열 처리, 브라우저 제어, 바코드·QR 코드 생성, ZIP 파일 읽기 기능을 제공합니다.':
    'A shared utility package for application development and SI projects at IMPIX Corporation. It provides number conversion and formatting, string processing, browser utilities, barcode and QR code generation, and ZIP file reading.',
  '패키지를 설치하고 MCP 연결과 공개 API 사용 방법을 확인합니다.':
    'Install the package and learn how to connect to MCP and use the public API.',
  '프로젝트에 필요한 peer dependency와 정적 리소스 설정은 설치 버전의 README와 공개 API를 확인하세요.':
    'Check the installed version’s README and public API for required peer dependencies and static resource setup.',
  '공개 API 사용하기': 'Use the public API',
  'API 목록에서 사용할 항목을 선택하면 공개 import 경로, 타입과 사용 코드를 확인할 수 있습니다.':
    'Select an API to view its public import paths, types and usage code.',
  '{{packageName}} API 보기': 'View {{packageName}} API',
  '연결 후 list_packages로 제공되는 패키지와 버전을 먼저 확인하세요. Playground의 API 목록과 MCP 서버에 등록된 자료는 다를 수 있습니다. 요청한 자료가 없으면 설치본의 공개 타입과 README를 기준으로 확인합니다.':
    'Use list_packages to check which packages and versions are available through MCP. The server’s content may differ from Playground’s API listings. If the required content is unavailable, consult the installed package’s public types and README.',
  'OWP에서 wrapper 컴포넌트·Hook·함수를 제공하는 경우에는 원본 API나 re-export 대신 해당 wrapper를 사용해 주세요. 번역 기능을 구현할 때는 @owp/components/hooks의 useOwpTranslation을, API 요청을 구현할 때는 @owp/core/hooks의 createOwpApiHooks를 먼저 확인해 주세요.':
    'Prefer OWP wrapper APIs. For internationalization, use useOwpTranslation from @owp/components/hooks. For API requests, use createOwpApiHooks from @owp/core/hooks.',
  '대상: {{packageName}} {{version}}\n- list_packages로 대상 패키지와 버전 제공 여부 확인.\n- 해당 버전의 공개 API·가이드·사용 예제를 조회해 구현.\n- OWP wrapper 컴포넌트·Hook·함수가 있으면 원본 API나 re-export보다 항상 우선. wrapper의 소유 패키지와 설치 버전도 확인.\n- 응답의 packageVersion 대조. 후속 조회에 같은 version과 releaseId 사용.\n- 요청한 버전·자료가 없으면 다른 버전으로 대체하지 않고 설치본의 공개 타입·README 확인.':
    'Target: {{packageName}} {{version}}\n- Check package and version availability with list_packages.\n- Implement using that version’s API documentation, guides, and examples.\n- Prefer OWP wrapper APIs. Verify the package that provides each wrapper and its installed version.\n- Verify that packageVersion matches the requested version. Reuse the same version and releaseId for subsequent lookups.\n- If the requested version or content is unavailable, consult the installed package’s public types and README without substituting another version.',
} as const;
