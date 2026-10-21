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
  source('agents', `${framework}/references/datagrid.md`, 'datagrid', [
    'connection',
    'columns',
    'styling',
    'select',
    'tree-detail',
    'formatting',
  ]),
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
  source('agents', `${consumer}/references/editing.md`, 'datagrid', ['editing', 'rows']),
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
