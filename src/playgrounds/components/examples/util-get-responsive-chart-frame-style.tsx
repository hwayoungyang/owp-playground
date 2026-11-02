import { useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { getResponsiveChartFrameStyle } from '@owp/components/utils';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function Frame({
  responsive,
  wide = false,
}: {
  readonly responsive: boolean;
  readonly wide?: boolean;
}) {
  const { t } = useOwpTranslation();
  const theme = useTheme();
  return (
    <Box sx={responsive ? getResponsiveChartFrameStyle(theme) : { height: 180, overflow: 'auto' }}>
      <Box sx={{ p: 2, boxSizing: 'border-box', bgcolor: 'action.hover' }}>
        <Box
          sx={{
            minWidth: wide ? 900 : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Typography>{t('차트가 들어갈 콘텐츠 영역')}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const theme = useTheme();
  useEffect(() => {
    onData({ withoutHelper: { height: 180 }, responsive: getResponsiveChartFrameStyle(theme) });
  }, [onData, theme]);
  return (
    <>
      <ExampleSection
        title="180px 고정 높이와 비교"
        description="높이를 180px로 고정한 영역과 비교합니다."
      >
        <Frame responsive={false} />
      </ExampleSection>
      <ExampleSection
        title="viewport에 맞춘 프레임 높이"
        description="sm 미만에서는 360px, sm 이상에서는 420px입니다. 직접 자식은 프레임 크기를 채웁니다."
      >
        <Frame responsive />
      </ExampleSection>
      <ExampleSection
        title="프레임보다 넓은 콘텐츠"
        description="900px 콘텐츠를 넣어 가로 스크롤을 확인합니다. 세로 overflow는 숨깁니다."
      >
        <Frame responsive wide />
      </ExampleSection>
    </>
  );
}
