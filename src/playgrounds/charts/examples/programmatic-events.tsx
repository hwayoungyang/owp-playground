import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { useRef, useState } from 'react';
import type { NativeInstance } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data } = useNativeData();
  const chart = useRef<NativeInstance | undefined>(undefined);
  const [index, setIndex] = useState(2);
  function activate(clear = false) {
    const instance = chart.current;
    if (!instance) return;
    const elements = clear ? [] : data.datasets.map((_, datasetIndex) => ({ datasetIndex, index }));
    instance.setActiveElements(elements);
    instance.tooltip?.setActiveElements(elements, {
      x: instance.chartArea.left + instance.chartArea.width / 2,
      y: instance.chartArea.top + instance.chartArea.height / 2,
    });
    instance.update();
    props.onRecord?.('activate', clear ? 'clear' : String(index));
  }
  return (
    <>
      <Controls>
        <Range label="선택할 point" value={index} min={0} max={5} onChange={setIndex} />
        <Button variant="outlined" onClick={() => activate()}>
          {t('Point 선택')}
        </Button>
        <Button variant="outlined" onClick={() => activate(true)}>
          {t('선택 해제')}
        </Button>
      </Controls>
      <ChartCanvas type="bar" data={data} chartRef={chart} {...props} />
    </>
  );
}
