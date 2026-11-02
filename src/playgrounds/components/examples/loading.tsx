import { Box, Button, Typography } from '@mui/material';
import { OwpLoading } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      delayedRevision: 0,
      variants: ['linear', 'beat', 'pulse', 'sync', 'fade', 'propagate', 'rotate'],
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="진행 막대"
        description="linear는 가용 너비 안에 진행 막대를 표시합니다."
      >
        <div className="components-example-grid">
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">linear</Typography>
            <OwpLoading variant="linear" delay={0} ariaLabel={t('처리 중')} />
          </Box>
        </div>
      </ExampleSection>
      <ExampleSection
        title="점 형태 indicator"
        description="beat·pulse·sync의 점 움직임을 비교합니다."
      >
        <div className="components-example-grid">
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">beat</Typography>
            <OwpLoading variant="beat" delay={0} ariaLabel={t('처리 중')} />
          </Box>
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">pulse</Typography>
            <OwpLoading variant="pulse" delay={0} ariaLabel={t('처리 중')} />
          </Box>
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">sync</Typography>
            <OwpLoading variant="sync" delay={0} ariaLabel={t('처리 중')} />
          </Box>
        </div>
      </ExampleSection>
      <ExampleSection
        title="확산과 회전 indicator"
        description="fade·propagate·rotate의 형태와 크기를 비교합니다."
      >
        <div className="components-example-grid">
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">fade</Typography>
            <OwpLoading variant="fade" delay={0} ariaLabel={t('처리 중')} />
          </Box>
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">propagate</Typography>
            <OwpLoading variant="propagate" delay={0} ariaLabel={t('처리 중')} />
          </Box>
          <Box sx={{ minHeight: 120, position: 'relative' }}>
            <Typography variant="caption">rotate</Typography>
            <OwpLoading variant="rotate" delay={0} ariaLabel={t('처리 중')} />
          </Box>
        </div>
      </ExampleSection>
      <ExampleSection
        title="표시 지연"
        description="delay가 800ms인 indicator는 다시 시작한 뒤 잠시 기다리면 표시됩니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('delayedRevision', values.delayedRevision + 1)}
        >
          {t('지연 indicator 다시 시작')}
        </Button>
        <Box sx={{ minHeight: 120 }}>
          <OwpLoading
            key={values.delayedRevision}
            variant="linear"
            delay={800}
            ariaLabel={t('지연 처리 중')}
          />
        </Box>
      </ExampleSection>
    </>
  );
}
