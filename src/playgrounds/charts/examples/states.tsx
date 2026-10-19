import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import { type DataState, DataStateButtons } from '../../../shared/ui/DataStateButtons';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [state, setState] = useState<DataState>('ready');
  const records = useMonthlyRecords();
  const chart = useCartesian(
    { records: state === 'empty' || state === 'error' ? [] : records },
    props,
  );
  const change = (next: typeof state) => {
    setState(next);
    props.onRecord?.('state', next);
  };
  return (
    <>
      <Controls>
        <DataStateButtons state={state} onChange={change} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          {...chart}
          type="bar"
          height="100%"
          loading={state === 'loading'}
          noData={state === 'empty'}
          noDataMessage={t('표시할 차트 데이터가 없습니다.')}
          errorOverlay={
            state === 'error'
              ? {
                  message: t('차트 데이터를 불러오지 못했습니다.'),
                  onRetry: () => change('ready'),
                  retryLabel: t('다시 시도'),
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
