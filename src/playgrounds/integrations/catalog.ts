import type { ExampleMetadata, NavigationCategory } from '../../shared/types/playground';

export type IntegrationExampleProps = {
  readonly onData: (data: Readonly<Record<string, unknown>>) => void;
  readonly onRecord: (name: string, detail: string) => void;
};

export type IntegrationExample = ExampleMetadata & {
  readonly kind?: 'example';
};

export const integrationCategories = [
  { id: 'date-picker-examples', label: '날짜·시간 선택' },
  { id: 'excel-examples', label: '워크시트와 내보내기' },
  { id: 'pdf-examples', label: '문서 생성과 다운로드' },
  { id: 'theme-examples', label: '테마 설정' },
  { id: 'utils-examples', label: '포맷과 코드 생성' },
  { id: 'tailwind-examples', label: 'Tailwind CSS' },
] as const satisfies readonly NavigationCategory[];

export const integrationCatalog: readonly IntegrationExample[] = [
  {
    id: 'utilities',
    title: 'Tailwind 유틸리티',
    package: '@owp/tailwind-config',
    category: 'tailwind-examples',
    description: '열 개수와 간격을 바꾸며 반응형 배치를 확인합니다.',
    api: [],
    source: 'examples/utilities.tsx',
  },
  {
    id: 'date-range-picker',
    title: '날짜·기간 선택',
    package: '@owp/date-picker',
    category: 'date-picker-examples',
    description: '날짜·연월·기간·주차를 선택하고 반환값을 확인합니다.',
    api: [
      'OwpDatePicker',
      'OwpDateRangePicker',
      'OwpWeekDatePicker',
      'OwpDatePickerStyleScope',
      'formatDateToYmd',
      'getTodayYmd',
    ],
    source: 'examples/date-range-picker.tsx',
  },
  {
    id: 'time-picker',
    title: '시간 선택 (24h · 12h)',
    package: '@owp/date-picker',
    category: 'date-picker-examples',
    description: '24h·12h 표기로 시간 입력과 휠을 비교합니다.',
    api: [
      'OwpTimePicker',
      'OwpTimeWheel',
      'OwpDatePicker',
      'parseTimePickerInput',
      'getOwpTimeWheelSx',
    ],
    source: 'examples/time-picker.tsx',
  },
  {
    id: 'data-export',
    title: '배열 데이터 내보내기',
    package: '@owp/excel',
    category: 'excel-examples',
    description: '배열 데이터에 prefix·suffix를 적용하고 Excel 파일로 내보냅니다.',
    api: ['createExportDataToExcelBuffer', 'exportExcelByBuffer', 'ExcelHeader', 'ExcelDataMapper'],
    source: 'examples/data-export.tsx',
  },
  {
    id: 'cell-merge-style',
    title: '셀·병합 서식 구성',
    package: '@owp/excel',
    category: 'excel-examples',
    description: '제목 셀을 병합하고 배경색을 바꾼 Excel 파일을 생성합니다.',
    api: [
      'loadExcelJSBrowser',
      'setMergeCells',
      'setCellValue',
      'getLettersByIndex',
      'getIndexByLetters',
      'exportExcelByBuffer',
    ],
    source: 'examples/cell-merge-style.tsx',
  },
  {
    id: 'document-download',
    title: 'PDF 문서 생성과 다운로드',
    package: '@owp/pdf',
    category: 'pdf-examples',
    description: '제목과 참조 번호를 입력해 PDF 파일을 생성하고 다운로드합니다.',
    api: ['Document', 'Page', 'View', 'Text', 'StyleSheet', 'renderPdfToBlob', 'downloadPdf'],
    source: 'examples/document-download.tsx',
  },
  {
    id: 'vector-summary',
    title: 'SVG 벡터 그래프와 PDF',
    package: '@owp/pdf',
    category: 'pdf-examples',
    description: 'SVG 그래프를 확대해 보고, 같은 지표가 담긴 PDF를 생성합니다.',
    api: [
      'Document',
      'Page',
      'View',
      'Text',
      'Svg',
      'Rect',
      'Line',
      'StyleSheet',
      'renderPdfToBlob',
    ],
    source: 'examples/vector-summary.tsx',
  },
  {
    id: 'theme-mode-preview',
    title: '기본 테마와 다크 모드 프리뷰',
    package: '@owp/theme',
    category: 'theme-examples',
    description: '밝기·primary 색상·radius를 바꾸고 하위 화면에만 적용되는 테마를 확인합니다.',
    api: [
      'OwpThemeProvider',
      'defaultThemes',
      'changeThemeMode',
      'getThemeWithButtonPaletteDefaults',
      'defaultThemeOptions',
      'mustHaveThemeOptions',
      'extendThemeWithMixins',
    ],
    source: 'examples/theme-mode-preview.tsx',
  },
  {
    id: 'surface-tokens',
    title: '컴포넌트별 테마 설정',
    package: '@owp/theme',
    category: 'theme-examples',
    description: '색상을 선택해 Table·DataGrid·DatePicker의 테마 적용 결과를 확인합니다.',
    api: [
      'OwpThemeProvider',
      'useTableTheme',
      'useGridTheme',
      'useDatePickerTheme',
      'resolveOwpGridTheme',
      'resolveOwpTableTheme',
    ],
    source: 'examples/surface-tokens.tsx',
  },
  {
    id: 'value-format',
    title: '숫자·문자열·폼 기본값 포맷',
    package: '@owp/utils',
    category: 'utils-examples',
    description: '숫자와 문자열의 변환 결과를 확인하고 폼 기본값을 병합합니다.',
    api: [
      'formatNumber',
      'toFiniteNumber',
      'getDisplayValue',
      'getTrimmedValue',
      'isNilOrEmptyString',
      'getFormDefaultValues',
    ],
    source: 'examples/value-format.tsx',
  },
  {
    id: 'qrcode-generator',
    title: 'QR 코드 생성',
    package: '@owp/utils',
    category: 'utils-examples',
    description: '텍스트·크기·색상을 바꾸고 QR 코드 이미지를 생성합니다.',
    api: ['generateQrCodeDataUrl', 'generateQrCodeUrl', 'GenerateQrCodeImageOptions'],
    source: 'examples/qrcode-generator.tsx',
  },
  {
    id: 'barcode-generator',
    title: '바코드 생성',
    package: '@owp/utils',
    category: 'utils-examples',
    description: '텍스트·형식·높이를 바꾸고 바코드 이미지를 생성합니다.',
    api: ['generateBarcodeDataUrl', 'generateBarcodeBlob', 'GenerateBarcodeImageOptions'],
    source: 'examples/barcode-generator.tsx',
  },
];

export function integrationExamplesFor(packageId: string): readonly IntegrationExample[] {
  const packageName = packageId.startsWith('@owp/') ? packageId : `@owp/${packageId}`;
  return integrationCatalog.filter((entry) => entry.package === packageName);
}

export function integrationCategoriesFor(packageId: string): readonly NavigationCategory[] {
  const examples = integrationExamplesFor(packageId);
  return integrationCategories.filter((category) =>
    examples.some((example) => example.category === category.id),
  );
}

export function findIntegrationExample(
  packageId: string,
  id: string | null | undefined,
): IntegrationExample | undefined {
  if (!id) return undefined;
  const packageName = packageId.startsWith('@owp/') ? packageId : `@owp/${packageId}`;
  return integrationCatalog.find((entry) => entry.package === packageName && entry.id === id);
}
