const native = {
  borderRadius: 'BarOptions.borderRadius', borderSkipped: 'BarOptions.borderSkipped',
  barPercentage: 'BarControllerDatasetOptions.barPercentage', barThickness: 'BarControllerDatasetOptions.barThickness', grouped: 'BarControllerDatasetOptions.grouped',
  tension: 'LineOptions.tension', cubicInterpolationMode: 'LineOptions.cubicInterpolationMode', stepped: 'LineOptions.stepped',
  pointRadius: 'PointPrefixedOptions.pointRadius', pointStyle: 'PointOptions.pointStyle', pointBackgroundColor: 'PointPrefixedOptions.pointBackgroundColor',
  borderDash: 'LineOptions.borderDash', spanGaps: 'LineOptions.spanGaps', showLine: 'LineControllerDatasetOptions.showLine',
  'segment.borderColor': 'LineOptions.segment.borderColor', 'segment.borderDash': 'LineOptions.segment.borderDash',
  yAxisID: 'LineControllerDatasetOptions.yAxisID', indexAxis: 'CoreChartOptions.indexAxis',
  backgroundColor: 'CommonElementOptions.backgroundColor', 'data.datasets.data': 'ChartDatasetProperties.data',
  'scales.min': 'CoreScaleOptions.min', 'scales.max': 'CoreScaleOptions.max',
  'scales.suggestedMin': 'CoreScaleOptions.suggestedMin', 'scales.suggestedMax': 'CoreScaleOptions.suggestedMax',
  'scales.stacked': 'CartesianScaleOptions.stacked', 'scales.position': 'CartesianScaleOptions.position',
  'scales.stack': 'CartesianScaleOptions.stack', 'scales.stackWeight': 'CartesianScaleOptions.stackWeight',
  'scales.display': 'CoreScaleOptions.display', 'scales.type': 'ScaleTypeRegistry',
  'scales.grid.display': 'GridLineOptions.display', 'scales.grid.color': 'GridLineOptions.color',
  'scales.ticks.stepSize': 'LinearScaleOptions.ticks.stepSize', 'scales.ticks.callback': 'TickOptions.callback', 'ticks.callback': 'TickOptions.callback',
  'scales.title.display': 'CartesianScaleOptions.title.display', 'scales.title.text': 'CartesianScaleOptions.title.text', 'scales.title.align': 'CartesianScaleOptions.title.align',
  'interaction.mode': 'CoreInteractionOptions.mode', 'interaction.intersect': 'CoreInteractionOptions.intersect',
  'plugins.legend.title.display': 'LegendOptions.title.display', 'plugins.legend.title.text': 'LegendOptions.title.text',
  'plugins.title.align': 'TitleOptions.align', 'plugins.title.text': 'TitleOptions.text',
  'plugins.tooltip.callbacks.label': 'TooltipCallbacks.label', 'plugins.tooltip.callbacks.footer': 'TooltipCallbacks.footer',
  'plugins.tooltip.position': 'TooltipOptions.position', 'plugins.tooltip.usePointStyle': 'TooltipOptions.usePointStyle',
  tooltip: 'TooltipOptions', 'tooltip.setActiveElements': 'TooltipModel.setActiveElements', setActiveElements: 'Chart.setActiveElements',
};

const explicit = {
  datagrid: {
    exportName: 'OwpDataGridExcelDownloadOptions.exportName',
    type: 'OwpDataGridColumn.type', validate: 'OwpDataGridApi.validate',
    dataGridRef: 'OwpDataGridExportExcelButtonProps.dataGridRef',
    scope: 'OwpDataGridExcelSnapshotOptions.scope', position: 'OwpDataGridRowPlacement.position',
    targetRowId: 'OwpDataGridRowPlacement.targetRowId', 'summaryRows.valueGetter': 'OwpDataGridSummaryCell.valueGetter',
  },
  charts: {
    data: 'chart.js:ChartConfiguration.data', annotation: 'ChartAnnotationPluginOptions', 'plugins.annotation': 'ChartAnnotationPluginOptions', box: 'ChartAnnotationOptions',
    datalabels: 'ChartDataLabelsPluginOptions', 'plugins.datalabels': 'ChartDataLabelsPluginOptions',
    trendlineLinear: 'ChartTrendlineLinearOptions', line: 'ChartSeriesConfig.type', type: 'ChartSeriesConfig.type',
    mode: 'ChartDragZoomOptions.mode', start: 'ChartZoomSliderAxisOptions.start', end: 'ChartZoomSliderAxisOptions.end',
    'detailPanel.renderDetail': '@owp/datagrid:OwpDataGridDetailPanelOptions.renderDetail', renderCell: '@owp/datagrid:OwpDataGridColumn.renderCell',
  },
};

const exampleTargets = {
  datagrid: {
    'hook-connection': {
      getRows: '@owp/datagrid:OwpDataGridApi.getRows',
      focusCell: '@owp/datagrid:OwpDataGridApi.focusCell',
    },
    'ref-connection': {
      getRows: '@owp/datagrid:OwpDataGridApi.getRows',
      focusCell: '@owp/datagrid:OwpDataGridApi.focusCell',
    },
    'ref-data': { getRows: '@owp/datagrid:OwpDataGridApi.getRows' },
    'context-menu': { getRows: '@owp/datagrid:OwpDataGridApi.getRows' },
    'ref-changes': {
      getChanges: '@owp/datagrid:OwpDataGridApi.getChanges',
      hasUnsavedChanges: '@owp/datagrid:OwpDataGridApi.hasUnsavedChanges',
      acceptChanges: '@owp/datagrid:OwpDataGridApi.acceptChanges',
      onAfterReset: '@owp/datagrid:OwpDataGridResetChangesButtonApiProps.onAfterReset',
    },
    excel: {
      scope: '@owp/datagrid:OwpDataGridExcelSnapshotOptions.scope',
      exportName: '@owp/datagrid:OwpDataGridExcelDownloadOptions.exportName',
    },
    'detail-grid': { scope: '@owp/datagrid:OwpDataGridExcelSnapshotOptions.scope' },
    'custom-style': { headerRows: '@owp/datagrid:OwpDataGridProps.headerRows' },
    worksheet: { summaryRows: '@owp/datagrid:OwpDataGridProps.summaryRows' },
  },
  charts: {
    'drag-zoom': { mode: '@owp/charts:ChartDragZoomOptions.mode' },
    scatter: { type: '@owp/charts:ChartFrameProps.type' },
    'scatter-multi-axis': { type: '@owp/charts:ChartFrameProps.type' },
    bubble: { type: '@owp/charts:ChartFrameProps.type' },
    'box-plot': { type: '@owp/charts:ChartFrameProps.type' },
    treemap: {
      type: '@owp/charts:ChartFrameProps.type',
      data: '@owp/charts:OwpTreemapChartProps.data',
      style: '@owp/charts:OwpTreemapChartProps.style',
      formatter: '@owp/charts:OwpTreemapChartProps.formatter',
    },
    heatmap: {
      type: '@owp/charts:ChartFrameProps.type',
      domain: '@owp/charts:OwpHeatmapChartProps.domain',
      valueLabels: '@owp/charts:OwpHeatmapChartProps.valueLabels',
    },
    'target-line': { line: 'chartjs-plugin-annotation:LineAnnotationOptions' },
    sparkline: { animation: 'chart.js:CoreChartOptions.animation' },
    'programmatic-events': { chartRef: '@owp/charts:ChartFrameProps.chartRef' },
  },
};

/** 예제의 컴포넌트와 선언의 참조 관계로 API 설명 대상을 확인합니다. */
export function resolveExampleReferences({ packageId, examples, records, sourceText }) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const rootNames = packageId === 'datagrid' ? ['OwpDataGridProps', 'OwpDataGridColumn', 'OwpDataGridApi'] : packageId === 'core' ? [] : ['ChartFrameProps', 'CoreChartProps', 'ChartSeriesConfig', 'CreateChartDataParams'];
  function follow(record, parts, seen = new Set()) {
    if (!record || seen.has(`${record.id}/${parts.join('.')}`)) return [];
    if (!parts.length) return [record];
    seen.add(`${record.id}/${parts.join('.')}`);
    const member = byId.get(`${record.id}.${parts[0]}`);
    if (member) return follow(member, parts.slice(1), seen);
    return record.related.flatMap((id) => follow(byId.get(id), parts, seen));
  }
  return examples.map((example) => {
    const component = sourceText.get(example.id)?.match(/<(Owp\w+|ChartFrame|CoreChart)(?:\s|<)/)?.[1];
    const preferred = component ? [`${component}Props`, ...rootNames] : rootNames;
    const references = example.api.map((label) => {
      const context = `${packageId}/${example.id}/${label}`;
      const unique = (candidates) => {
        const matches = [...new Map(candidates.map((entry) => [entry.id, entry])).values()];
        if (matches.length > 1) throw new ReferenceError(`API 설명 대상이 모호합니다: ${context} (${matches.map((entry) => entry.id).sort().join(', ')})`);
        return matches[0];
      };
      const required = (id) => {
        const target = byId.get(id);
        if (!target) throw new ReferenceError(`API 설명 대상 선언이 없습니다: ${context} → ${id}`);
        return target;
      };
      const parts = label.split('.');
      let record;
      const exampleTarget = exampleTargets[packageId]?.[example.id]?.[label];
      if (exampleTarget) record = required(exampleTarget);
      if (!record && packageId === 'charts' && native[label]) record = required(`chart.js:${native[label]}`);
      // 컴포넌트의 직접 props를 우선하고 관련 타입의 동명 속성은 명시 규칙 뒤에서 탐색합니다.
      if (!record && component) record = unique(follow(byId.get(`@owp/${packageId}:${component}Props.${parts[0]}`), parts.slice(1)));
      if (!record && explicit[packageId]?.[label]) {
        const id = explicit[packageId][label];
        record = required(id.includes(':') ? id : `@owp/${packageId}:${id}`);
      }
      if (!record) record = byId.get(`@owp/${packageId}:${label}`);
      if (!record) {
        const candidates = preferred.flatMap((owner) => follow(byId.get(`@owp/${packageId}:${owner}`), parts));
        record = unique(candidates.filter((entry) => entry.package === `@owp/${packageId}`)) ?? unique(candidates);
      }
      if (!record) {
        const candidates = records.filter((entry) => entry.package === `@owp/${packageId}` && (entry.name === label || entry.path === label));
        record = unique(candidates);
      }
      if (!record) throw new ReferenceError(`API 설명 대상을 확인할 수 없습니다: ${packageId}/${example.id}/${label}`);
      return { label, id: record.id, packageId: record.package.startsWith('@owp/') ? record.package.slice(5) : packageId };
    });
    return { id: example.id, packageId, title: example.title, description: example.description, source: example.source, references };
  });
}
