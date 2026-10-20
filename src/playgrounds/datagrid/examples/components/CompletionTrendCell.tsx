import { Box, useTheme } from '@mui/material';
import type { CoreChartProps } from '@owp/charts/types';
import { lazy, Suspense } from 'react';
import { translate } from '../../../../shared/i18n/translate';
import type { Task } from '../../types';
import { initialTasks } from '../../model/data';

const CompletionTrendChart = lazy(() =>
  import('@owp/charts').then(({ CoreChart }) => ({ default: CoreChart })),
);

const trendOptions = {
  animation: false,
  events: [],
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false, min: -10, max: 110 } },
} satisfies CoreChartProps<'line'>['options'];

export function CompletionTrendCell({ row }: { readonly row: Task }) {
  const theme = useTheme();
  const current = row.quantity > 0 ? (row.completed / row.quantity) * 100 : 0;
  const rising = initialTasks.findIndex((task) => task.id === row.id) % 2 !== 0;
  const values = [18, 16, 12, 13, 8, 5, 6, 0].map((offset) =>
    Math.max(0, Math.min(100, current + (rising ? -offset : offset))),
  );
  return (
    <Box
      role="img"
      aria-label={translate('{{task}}의 완료율이 {{direction}} 추세이며 현재 {{percent}}%입니다.', {
        task: row.task,
        direction: translate(rising ? '상승' : '하락'),
        percent: Math.round(current * 10) / 10,
      })}
      sx={{ width: '100%', minWidth: 0, height: 32, py: 0.5, boxSizing: 'border-box' }}
    >
      <Box aria-hidden="true" sx={{ height: '100%' }}>
        <Suspense fallback={null}>
          <CompletionTrendChart
            type="line"
            data={{
              labels: values.map((_, index) => index + 1),
              datasets: [
                {
                  data: values,
                  borderColor: rising ? theme.palette.success.main : theme.palette.error.main,
                  borderWidth: 2,
                  pointRadius: 0,
                  tension: 0.35,
                },
              ],
            }}
            options={trendOptions}
            height="100%"
          />
        </Suspense>
      </Box>
    </Box>
  );
}
