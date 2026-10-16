import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ChartFrame } from '@owp/charts';
import { createChartData, createChartOptions } from '@owp/charts/utils';
import './chart-layout.css';

const theme = createTheme();
/** API 필드명은 점을 포함한 하나의 키입니다. 실제 API 응답의 행 배열을 연결합니다. */
const apiRows = [
  { 'OWP_DATA.DATA1': '2026-01', 'OWP_DATA.DATA2': '86', 'OWP_DATA.DATA3': '84' },
  { 'OWP_DATA.DATA1': '2026-02', 'OWP_DATA.DATA2': '92', 'OWP_DATA.DATA3': '90' },
  { 'OWP_DATA.DATA1': '2026-03', 'OWP_DATA.DATA2': '104', 'OWP_DATA.DATA3': '108' },
] as const;

/** DATA1: 월, DATA2: 계획 생산량, DATA3: 실제 생산량. 계산할 값만 Number로 변환합니다. */
const records = apiRows.map((row) => ({
  month: row['OWP_DATA.DATA1'],
  planned: Number(row['OWP_DATA.DATA2']),
  actual: Number(row['OWP_DATA.DATA3']),
}));
const data = createChartData({
  categoryKey: 'month',
  data: records,
  series: [
    {
      dataKey: 'planned',
      label: 'Plan',
      type: 'bar',
      backgroundColor: theme.palette.primary.light,
      datasetOptions: { borderRadius: 4, maxBarThickness: 36 },
    },
    {
      dataKey: 'actual',
      label: 'Actual',
      type: 'bar',
      backgroundColor: theme.palette.primary.main,
      datasetOptions: { borderRadius: 4, maxBarThickness: 36 },
    },
  ],
});
export function GettingStartedChart() {
  return (
    <ThemeProvider theme={theme}>
      <div className="owp-chart-surface">
        <ChartFrame
          aria-label="Monthly plan and actual output"
          type="bar"
          data={data}
          preset="owp"
          options={createChartOptions()}
          height={360}
          legend={{ position: 'bottom', align: 'center' }}
          zoomSlider={{ x: true }}
          showExportButton={false}
        />
      </div>
    </ThemeProvider>
  );
}
