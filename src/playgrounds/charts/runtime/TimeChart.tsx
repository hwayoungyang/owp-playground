import { Button } from '@mui/material';
import { registerChartTime } from '@owp/charts/chartjs/time';
import { useOwpTranslation } from '@owp/components/hooks';
import { type ReactNode, useEffect, useState } from 'react';

/** Luxon adapter 등록이 끝난 뒤에만 시간축 차트를 mount합니다. */
export function TimeChart({ children }: { readonly children: ReactNode }) {
  const { t } = useOwpTranslation();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    registerChartTime().then(
      () => {
        if (active) setReady(true);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  if (ready) return children;
  if (failed) {
    return (
      <div className="chart-canvas" role="alert">
        <p>{t('시간축을 불러오지 못했습니다. 다시 시도해 주세요.')}</p>
        <Button
          variant="outlined"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          {t('다시 시도')}
        </Button>
      </div>
    );
  }
  return (
    <div className="chart-canvas" role="status">
      {t('시간축을 불러오는 중입니다.')}
    </div>
  );
}
