const framework = 'solutions/owp-framework/skills/owp-framework';
const consumer = 'si/hankum/skills/hankum-mes-datagrid';
const source = (root, file, packageId, topics, scope = 'usage') => ({
  root,
  file,
  packageId,
  topics,
  scope,
});

export const sourceMap = [
  source('agents', `${framework}/SKILL.md`, 'shared', [], 'workflow'),
  {
    ...source('agents', `${framework}/references/datagrid.md`, 'datagrid', [
      'connection',
      'columns',
      'styling',
      'select',
      'tree-detail',
      'formatting',
    ]),
    sectionOverrides: {
      'Text 컬럼 입력 정책': {
        disposition: 'mapped',
        guideIds: ['@owp/datagrid:guide.editing'],
        note: 'textOptions의 입력·IME·오류 보존과 거부 메시지·warning 계약을 편집 가이드에 연결합니다. 개발·회귀 검증 절차는 원본에서 관리합니다.',
      },
      '컬럼별 검증 시점과 재입력 오류 해제': {
        disposition: 'mapped',
        guideIds: ['@owp/datagrid:guide.editing'],
        note: 'validationMode·clearErrorOnInput의 공개 컬럼 계약과 명시적 검증·오류 수명을 편집 가이드에 연결합니다. 회귀 검사 절차는 원본에서 관리합니다.',
      },
    },
  },
  source('agents', `${framework}/references/charts.md`, 'charts', [
    'composition',
    'identity',
    'zoom',
    'states',
    'tooltip-plugins',
    'live',
    'utilities',
    'export-layout',
  ]),
  source('agents', `${consumer}/SKILL.md`, 'datagrid', ['connection'], 'workflow'),
  source(
    'agents',
    `${consumer}/references/usage.md`,
    'datagrid',
    ['connection', 'states', 'formatting'],
    'consumer',
  ),
  source('agents', `${consumer}/references/columns-layout.md`, 'datagrid', [
    'columns',
    'layout-data',
    'select',
    'formatting',
  ]),
  source('agents', `${consumer}/references/styling-select.md`, 'datagrid', ['styling', 'select']),
  source(
    'agents',
    `${consumer}/references/selection.md`,
    'datagrid',
    ['selection', 'states'],
    'consumer',
  ),
  {
    ...source('agents', `${consumer}/references/editing.md`, 'datagrid', ['editing', 'rows']),
    sectionOverrides: {
      'Text 컬럼 입력 정책': {
        disposition: 'mapped',
        guideIds: ['@owp/datagrid:guide.editing'],
        note: '공개 textOptions와 검증·오류 수명 계약만 편집 가이드에 연결합니다. 소비앱의 업무별 컬럼·저장 정책과 검증 절차는 일반 패키지 계약으로 확장하지 않습니다.',
      },
      'Row reordering': {
        disposition: 'mapped',
        guideIds: ['@owp/datagrid:guide.rows'],
        note: '행 이동과 순서 변경의 공개 계약을 행 관리 가이드에 연결합니다. 서버 저장·실패 복구 정책은 소비앱이 담당합니다.',
      },
    },
  },
  source('agents', `${consumer}/references/editing-save.md`, 'datagrid', ['saving', 'rows']),
  source('agents', `${consumer}/references/master-detail.md`, 'datagrid', ['tree-detail']),
  source('agents', `${consumer}/references/number-formatting.md`, 'datagrid', ['formatting']),
  source('agents', `${consumer}/references/temporal-cells.md`, 'datagrid', ['formatting']),
  source(
    'agents',
    'si/hankum/skills/hankum-mes-page-layout/references/charts.md',
    'charts',
    ['composition', 'zoom', 'states', 'utilities', 'export-layout'],
    'consumer',
  ),
  {
    ...source('framework', 'packages/owp-charts/docs/chart-api.md', 'charts', [
      'composition',
      'identity',
      'states',
      'live',
      'export-layout',
    ]),
    sectionOverrides: {
      '시간축 (`time`·`timeseries`)': {
        disposition: 'mapped',
        guideIds: ['@owp/charts:guide.composition', '@owp/charts:guide.zoom'],
        note: '/chartjs/time의 registerChartTime과 ChartTime* 공개 타입, 앱의 adapter 준비 및 millisecond 단위의 zoom·slider 계약을 연결합니다.',
      },
      '로그축 (`logarithmic`)': {
        disposition: 'mapped',
        guideIds: ['@owp/charts:guide.composition', '@owp/charts:guide.zoom'],
        note: 'LogarithmicScale 자동 등록과 양수 입력, native zoom·reset 지원 및 로그축의 OWP zoomSlider 제한을 연결합니다.',
      },
      Subtitle: {
        disposition: 'mapped',
        guideIds: ['@owp/charts:guide.composition', '@owp/charts:guide.export-layout'],
        note: 'Subtitle 자동 등록과 native 옵션, canvas PNG export 및 별도 aria-label 계약을 연결합니다.',
      },
    },
  },
  source('framework', 'packages/owp-charts/docs/common-utilities.md', 'charts', [
    'zoom',
    'identity',
    'utilities',
  ]),
  source('framework', 'packages/owp-charts/docs/area-radial.md', 'charts', ['area-radial']),
  source('framework', 'packages/owp-charts/docs/advanced-geometry.md', 'charts', ['geometry']),
  source('framework', 'packages/owp-charts/docs/migration-validation.md', 'charts', [], 'history'),
];
