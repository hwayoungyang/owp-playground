/** 앱 구성 예시의 차트 렌더링 구현과 실행 예제의 대응 관계. */
export const referenceChartCoverage = {
  OrderChart: ['bar', 'x-slider', 'y-sliders', 'linked'],
  RankChart: ['ranking', 'data-labels'],
  SalesChart: ['plan-actual', 'dual-axis', 'trendline', 'data-labels'],
  MonthlyReceiptChart: ['monthly-receipt', 'linked'],
  FulfillChart: ['fulfillment'],
  OperChart: ['oee', 'target-line', 'range-band', 'linked'],
  TopChart: ['ranking'],
  StatsChart: ['small-multiples'],
  GaugeChart: ['gauge'],
  HistChart: ['histogram'],
  AchieveChart: ['percent-axis'],
  MtChart: ['triple-axis'],
  TimeSeriesTrendChart: ['time-series', 'date-time', 'external-tooltip'],
  CompletionTrendCell: ['sparkline'],
  LineSamplePanel: ['detail-chart', 'png-export'],
} as const;
