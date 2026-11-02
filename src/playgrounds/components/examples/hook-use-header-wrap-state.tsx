import { useEffect, useId, useMemo, useState } from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import { useHeaderWrapState, useOwpTranslation } from '@owp/components/hooks';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function HeaderSample({
  id,
  enabled,
  fallback = false,
  report,
}: Omit<SectionObserver, 'onRecord'> & { readonly enabled: boolean; readonly fallback?: boolean }) {
  const { t } = useOwpTranslation();
  const labelId = useId();
  const [width, setWidth] = useState(360);
  const dependencies = useMemo(() => [t], [t]);
  const { containerRef, titleRef, slotsRef, actionsRef, isWrapped } = useHeaderWrapState(
    dependencies,
    { enabled, wrappedWhenDisabled: fallback },
  );
  useEffect(() => {
    report(id, { width, enabled, wrappedWhenDisabled: fallback, isWrapped });
  }, [report, id, width, enabled, fallback, isWrapped]);
  return (
    <Stack spacing={2}>
      <Typography id={labelId}>
        {t('헤더 너비')}: {width}px
      </Typography>
      <Slider
        aria-labelledby={labelId}
        value={width}
        min={240}
        max={800}
        step={20}
        onChange={(_, value) => {
          if (typeof value === 'number') setWidth(value);
        }}
      />
      <Box
        ref={containerRef}
        sx={{
          width,
          maxWidth: '100%',
          display: 'flex',
          flexWrap: isWrapped ? 'wrap' : 'nowrap',
          gap: 2,
          p: 2,
          border: 1,
          borderColor: 'divider',
          boxSizing: 'border-box',
          overflowX: 'auto',
        }}
      >
        <Box ref={titleRef} sx={{ flexShrink: 0 }}>
          <Typography>{t('샘플 헤더')}</Typography>
        </Box>
        <Box ref={slotsRef} sx={{ display: 'flex', flexShrink: 0 }}>
          <Button sx={{ whiteSpace: 'nowrap' }}>{t('검색 조건')}</Button>
        </Box>
        <Box ref={actionsRef} sx={{ display: 'flex', flexShrink: 0, gap: 2 }}>
          <Button variant="outlined">{t('검색')}</Button>
          <Button variant="outlined">{t('초기화')}</Button>
        </Box>
      </Box>
      <ExampleResult value={{ isWrapped }} />
    </Stack>
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <>
      <ExampleSection
        title="실제 너비 측정"
        description="Hook은 한 줄에 들어가는지 측정합니다. 예제는 isWrapped에 따라 flexWrap을 지정합니다."
      >
        <HeaderSample id="measured" enabled report={report} />
      </ExampleSection>
      <ExampleSection
        title="측정 중지와 한 줄 기본값"
        description="enabled가 false이면 측정을 중지하고 기본값 false를 반환합니다."
      >
        <HeaderSample id="disabled" enabled={false} report={report} />
      </ExampleSection>
      <ExampleSection
        title="측정 중지와 줄바꿈 기본값"
        description="측정을 중지해도 wrappedWhenDisabled를 true로 지정하면 true를 반환합니다."
      >
        <HeaderSample id="fallback" enabled={false} fallback report={report} />
      </ExampleSection>
    </>
  );
}
