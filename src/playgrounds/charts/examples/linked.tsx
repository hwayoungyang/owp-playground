import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useId, useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t } = useOwpTranslation();
  const group = useId();
  const [enabled, setEnabled] = useState(true);
  const [crosshair, setCrosshair] = useState(true);
  const [tooltip, setTooltip] = useState(true);
  const [zoom, setZoom] = useState(true);
  const records = useMonthlyRecords();
  const first = useCartesian({ records }, { onRecord: props.onRecord });
  const second = useCartesian({
    records: records.slice(2, 10),
    series: [{ dataKey: 'plan', label: t('계획'), type: 'line' }],
  });
  useEffect(() => {
    onData?.({
      labels: records.map((record) => record.category),
      series: [
        { label: t('실적'), values: records.map((record) => record.actual) },
        {
          label: t('계획'),
          values: records.map((record, index) => (index >= 2 && index < 10 ? record.plan : null)),
        },
      ],
    });
  }, [records, onData, t]);
  const linkedInteraction = {
    enabled,
    group,
    syncBy: 'label',
    syncCrosshair: crosshair,
    syncTooltip: tooltip,
    syncZoom: zoom,
  } as const;
  return (
    <>
      <Controls>
        <Toggle label="동기화" value={enabled} onChange={setEnabled} />
        <Toggle label="Crosshair 동기화" value={crosshair} onChange={setCrosshair} />
        <Toggle label="Tooltip 동기화" value={tooltip} onChange={setTooltip} />
        <Toggle label="Zoom 동기화" value={zoom} onChange={setZoom} />
      </Controls>
      <div className="chart-pair">
        <section className="chart-panel">
          <h2>{t('실적 · 1~12월')}</h2>
          <div className="chart-canvas">
            <ChartFrame
              {...first}
              type="bar"
              height="100%"
              linkedInteraction={linkedInteraction}
              zoomSlider={{ x: true }}
            />
          </div>
        </section>
        <section className="chart-panel">
          <h2>{t('계획 · 3~10월')}</h2>
          <div className="chart-canvas">
            <ChartFrame
              {...second}
              type="line"
              height="100%"
              linkedInteraction={linkedInteraction}
              zoomSlider={{ x: true }}
            />
          </div>
        </section>
      </div>
      <p className="chart-note">{t('3~10월에 포인터를 올려 두 차트의 동기화를 확인합니다.')}</p>
    </>
  );
}
