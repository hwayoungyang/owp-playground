import { Alert, Button } from '@mui/material';
import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [state, setState] = useState<'ready' | 'loading' | 'empty' | 'error'>('ready');
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
        {(['ready', 'loading', 'empty', 'error'] as const).map((value) => (
          <Button
            key={value}
            variant={state === value ? 'contained' : 'outlined'}
            aria-pressed={state === value}
            onClick={() => change(value)}
          >
            {t({ ready: '정상', loading: '로딩', empty: '데이터 없음', error: '오류' }[value])}
          </Button>
        ))}
      </Controls>
      {state === 'error' ? (
        <div className="chart-empty">
          <Alert severity="error">{t('차트 데이터를 불러오지 못했습니다.')}</Alert>
          <Button variant="outlined" onClick={() => change('ready')}>
            {t('다시 시도')}
          </Button>
        </div>
      ) : state === 'empty' ? (
        <div className="chart-empty" role="status">
          {t('표시할 차트 데이터가 없습니다.')}
        </div>
      ) : (
        <div className="chart-canvas" aria-busy={state === 'loading'}>
          <ChartFrame {...chart} type="bar" height="100%" loading={state === 'loading'} />
        </div>
      )}
    </>
  );
}
