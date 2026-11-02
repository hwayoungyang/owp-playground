import { formatApiDescription } from '../../shared/i18n/reference-copy';
import { apiRoles } from './roles';
import { describeApiKind } from './description-kind';
import type { PublicApiKind } from './types';

const descriptions: Readonly<Record<string, string>> = {
  OwpAlertDialog: '알림 내용을 다이얼로그에 표시하고 사용자가 확인할 수 있게 합니다.',
  ChartFrame: '차트와 범례·제목·내보내기 기능을 하나의 프레임에 배치합니다.',
  ChartLegend: '차트 데이터의 범례 항목과 표시 상태를 렌더링합니다.',
  ChartSeriesIndicator: '차트 시리즈의 색상과 형태를 나타내는 표시 요소입니다.',
  ChartZoomResetButton: '확대한 차트를 원래 범위로 되돌리는 버튼입니다.',
  ChartZoomSliders: '슬라이더로 차트에 표시할 축 범위를 조절합니다.',
  CoreChart: 'Chart.js 차트에 OWP의 공통 설정을 연결하는 React 컴포넌트입니다.',
  CHART_SIDE_ZOOM_SLIDER_PADDING: '차트 옆 확대 슬라이더에 사용하는 여백 값입니다.',
  CHART_SERIES_INDICATOR_VARIANT: '차트 시리즈 표시 요소의 형태를 구분하는 상수입니다.',
  getChartSeriesIndicatorVariant: '시리즈 정보에 대응하는 표시 요소의 형태를 반환합니다.',
  captureChartScrollState: '이벤트 대상과 연결된 스크롤 상태를 보관합니다.',
  restoreChartScrollState: '보관한 스크롤 상태를 다시 적용합니다.',
  createAxisDomain: '시작값과 끝값으로 축 범위를 구성합니다.',
  createAxisTicks: '축의 시작값·끝값과 눈금 수에 맞는 눈금 배열을 만듭니다.',
  createCategoryAxisScale: '범주 축의 눈금과 격자 옵션을 구성합니다.',
  createChartHorizontalBarTrackPlugin:
    '가로 막대 차트에 배경 트랙을 표시하는 Chart.js 플러그인을 만듭니다.',
  createChartHorizontalBarValueLabelsPlugin:
    '가로 막대 차트에 값 라벨을 표시하는 Chart.js 플러그인을 만듭니다.',
  createChartOptions: '차트의 축·플러그인·상호작용 등 공통 옵션을 구성합니다.',
  createIntegerAxisScale: '정수 눈금을 사용하는 축 옵션을 만듭니다.',
  createLinearAxisScale: '범위와 눈금 표시 형식을 지정하는 선형 축 옵션을 만듭니다.',
  createNumberAxisScale: '숫자 값을 표시하는 선형 축 옵션을 만듭니다.',
  createPercentAxisScale: '백분율 눈금을 표시하는 축 옵션을 만듭니다.',
  createZoomSliderAxis: '차트 축의 범위와 위치를 확대 슬라이더 설정으로 변환합니다.',
  enableDragZoom: '차트 옵션에 드래그 확대 동작을 연결합니다.',
  formatNumberAxisTick: '숫자 축의 눈금 값을 표시 문자열로 변환합니다.',
  formatPercentAxisTick: '백분율 축의 눈금 값을 표시 문자열로 변환합니다.',
  formatRawAxisTick: '축 눈금 값을 원래 값에 대응하는 문자열로 변환합니다.',
  formatTooltipLabel: 'Tooltip context와 값 formatter로 라벨 문자열을 구성합니다.',
  getAxisScaleRange: '축의 시작값과 끝값을 min·max 범위로 변환합니다.',
  getChartTooltipNumberValue: 'Chart.js Tooltip context에서 숫자 값을 읽습니다.',
  registerChartCore: 'OWP 차트에 필요한 Chart.js 구성 요소를 등록합니다.',
  I18nextProvider: '하위 React 컴포넌트에 i18next 인스턴스를 제공합니다.',
  Trans: '번역 문구 안에 React 요소와 보간값을 연결합니다.',
  createInstance: '앱에서 별도로 초기화할 수 있는 i18next 인스턴스를 만듭니다.',
  getI18n: 'react-i18next에 연결된 i18next 인스턴스를 읽습니다.',
  i18next: '공개 i18next 인스턴스입니다. 앱의 번역 초기화와 리소스 설정에 사용합니다.',
  initReactI18next: 'i18next 초기화에 React 연동 기능을 등록하는 플러그인입니다.',
  setI18n: 'react-i18next가 사용할 i18next 인스턴스를 지정합니다.',
  useTranslation: 'React 컴포넌트에서 번역 함수와 i18next 인스턴스를 읽습니다.',
  owpCoreAssetsPlugin: 'Vite에서 Core의 폰트·아이콘·고정 이미지 경로와 관련 리소스를 연결합니다.',
  resolveOwpFixedImageAssetRoot: 'Core 고정 이미지의 실제 리소스 디렉터리를 찾습니다.',
  resolveOwpFontAssetRoot: 'Core 폰트의 실제 리소스 디렉터리를 찾습니다.',
  resolveOwpIconAssetRoot: 'Core 아이콘의 실제 리소스 디렉터리를 찾습니다.',
  Canvas: 'PDF 페이지에서 사용자 지정 Canvas 그리기 작업을 제공합니다.',
  Note: 'PDF 문서에 주석 요소를 추가합니다.',
  StyleSheet: 'PDF 요소에 적용할 스타일을 정의하는 공개 객체입니다.',
  defaultFieldTableTheme: 'OwpFieldTable에 사용하는 기본 테마 설정입니다.',
  defaultDataGridTheme: 'DataGrid의 기본 테마 설정입니다.',
  defaultTreeGridTheme: '트리 Grid의 기본 테마 설정입니다.',
};

const english: Readonly<Record<string, string>> = {
  OwpAlertDialog: 'Displays an alert dialog with a confirmation action.',
  ChartFrame: 'Arranges a chart with its legend, title, and export actions.',
  ChartLegend: 'Renders chart legend entries and their visibility state.',
  ChartSeriesIndicator: 'Displays the color and shape of a chart series.',
  ChartZoomResetButton: 'Restores the original range of a zoomed chart.',
  ChartZoomSliders: 'Adjusts the visible chart axis range with sliders.',
  CoreChart: 'Connects OWP shared options to a Chart.js React chart.',
  CHART_SIDE_ZOOM_SLIDER_PADDING: 'Padding used by the zoom slider beside a chart.',
  CHART_SERIES_INDICATOR_VARIANT: 'Public variants for chart series indicators.',
  getChartSeriesIndicatorVariant: 'Returns the indicator variant for a series entry.',
  captureChartScrollState: 'Captures scroll state associated with an event target.',
  restoreChartScrollState: 'Restores a previously captured scroll state.',
  createAxisDomain: 'Creates an axis domain from its start and end values.',
  createAxisTicks: 'Creates axis ticks using the range and requested tick count.',
  createCategoryAxisScale: 'Configures category axis ticks and grid options.',
  createChartHorizontalBarTrackPlugin:
    'Creates a Chart.js plugin that draws horizontal bar tracks.',
  createChartHorizontalBarValueLabelsPlugin:
    'Creates a Chart.js plugin that draws horizontal bar value labels.',
  createChartOptions: 'Configures shared chart axes, plugins, and interactions.',
  createIntegerAxisScale: 'Creates axis options with integer ticks.',
  createLinearAxisScale: 'Creates linear axis options with a range and tick format.',
  createNumberAxisScale: 'Creates linear axis options for numeric values.',
  createPercentAxisScale: 'Creates axis options with percentage ticks.',
  createZoomSliderAxis: 'Converts an axis range and position into zoom slider options.',
  enableDragZoom: 'Connects drag zoom behavior to chart options.',
  formatNumberAxisTick: 'Formats a numeric axis tick as text.',
  formatPercentAxisTick: 'Formats a percentage axis tick as text.',
  formatRawAxisTick: 'Converts an axis tick value to its text representation.',
  formatTooltipLabel: 'Creates a tooltip label from its context and value formatter.',
  getAxisScaleRange: 'Converts an axis domain to a min and max range.',
  getChartTooltipNumberValue: 'Reads a numeric value from a Chart.js tooltip context.',
  registerChartCore: 'Registers the Chart.js elements required by OWP charts.',
  I18nextProvider: 'Provides an i18next instance to descendant React components.',
  Trans: 'Combines translated text with React elements and interpolation values.',
  createInstance: 'Creates an i18next instance that the application can initialize separately.',
  getI18n: 'Reads the i18next instance connected to react-i18next.',
  i18next: 'The public i18next instance for translation initialization and resources.',
  initReactI18next: 'Registers React integration during i18next initialization.',
  setI18n: 'Sets the i18next instance used by react-i18next.',
  useTranslation: 'Reads the translation function and i18next instance in React.',
  owpCoreAssetsPlugin: 'Connects Core fonts, icons, and fixed image resources in Vite.',
  resolveOwpFixedImageAssetRoot: 'Resolves the resource directory for Core fixed images.',
  resolveOwpFontAssetRoot: 'Resolves the resource directory for Core fonts.',
  resolveOwpIconAssetRoot: 'Resolves the resource directory for Core icons.',
  Canvas: 'Provides custom canvas drawing on a PDF page.',
  Note: 'Adds a note annotation to a PDF document.',
  StyleSheet: 'Defines styles applied to PDF elements.',
  defaultFieldTableTheme: 'Default theme options for OwpFieldTable.',
  defaultDataGridTheme: 'Default theme options for DataGrid.',
  defaultTreeGridTheme: 'Default theme options for tree grids.',
};

export const publicDescriptionEnglish = Object.fromEntries(
  Object.entries(descriptions).map(([name, text]) => [text, english[name] ?? text]),
);

function roleDescription(
  entry: {
    readonly name: string;
    readonly description: string;
    readonly modules: readonly string[];
    readonly kind: PublicApiKind;
  },
  translate: (key: string, values?: Readonly<Record<string, string>>) => string,
): string {
  const formatRole = (description: string) => describeApiKind(description, entry.kind, translate);
  const role = apiRoles[entry.name];
  if (role) return formatRole(translate(role[0]));
  if (entry.modules.some((module) => module.endsWith('/icons')))
    return formatRole(translate('SVG 아이콘'));
  const propsOwner = entry.name.replace(/(?:Own)?Props$/, '');
  const component = propsOwner !== entry.name ? apiRoles[propsOwner] : undefined;
  if (component) return formatRole(translate('{{name}} Props', { name: translate(component[0]) }));
  if (entry.kind === 'asset')
    return formatRole(translate(entry.name.endsWith('.css') ? 'CSS' : '패키지 정보'));
  if (entry.name.startsWith('OWP_GRID_SCROLLBAR_'))
    return formatRole(translate('Grid 스크롤바 기본 스타일'));
  if (entry.name.startsWith('OWP_GRID_DRAG_'))
    return formatRole(translate('Grid 드래그 기본 스타일'));
  if (!entry.description)
    return formatRole(
      translate(
        entry.kind === 'type' ? '공개 타입' : entry.kind === 'value' ? '공개 설정값' : '공개 API',
      ),
    );
  const text = Object.values(descriptions).includes(entry.description)
    ? translate(entry.description)
    : entry.description;
  const paragraph = text.split(/\n\s*\n/)[0] ?? text;
  return formatApiDescription(paragraph);
}

export function displayPublicDescription(
  entry: Parameters<typeof roleDescription>[0],
  translate: Parameters<typeof roleDescription>[1],
): string {
  return roleDescription(entry, translate);
}

export function publicDescription(
  name: string,
  modules: readonly string[],
  original: string,
): string {
  if (original) return original;
  if (modules.some((module) => module.endsWith('/icons')))
    return `${name} SVG 아이콘을 표시합니다. 크기·색상 등은 Props에서 설정합니다.`;
  if (name.startsWith('OWP_GRID_SCROLLBAR_'))
    return `${name}은 Grid 스크롤바의 기본 스타일 값입니다. 값과 타입은 Type 탭에서 확인할 수 있습니다.`;
  if (name.startsWith('OWP_GRID_DRAG_'))
    return `${name}은 Grid 드래그 상태의 기본 스타일 값입니다. 값과 타입은 Type 탭에서 확인할 수 있습니다.`;
  return descriptions[name] ?? '';
}
