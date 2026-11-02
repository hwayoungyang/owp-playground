import { useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { getResponsivePageLayoutStyle } from '@owp/components/utils';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function PageLayout({
  applied,
  classes = true,
}: {
  readonly applied: boolean;
  readonly classes?: boolean;
}) {
  const { t } = useOwpTranslation();
  const theme = useTheme();
  return (
    <Box
      sx={
        applied ? { ...getResponsivePageLayoutStyle(theme), gap: 2 } : { display: 'flex', gap: 2 }
      }
    >
      <Box className={classes ? 'owp-panel' : undefined} sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Typography>{t('검색 패널')}</Typography>
      </Box>
      <Box
        className={classes ? 'owp-chart-frame' : undefined}
        sx={{ bgcolor: 'action.hover', p: 2 }}
      >
        <Box sx={{ display: 'grid', placeItems: 'center' }}>
          <Typography>{t('차트 콘텐츠')}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const theme = useTheme();
  useEffect(() => {
    onData({
      applied: getResponsivePageLayoutStyle(theme),
      selectors: ['.owp-panel', '.owp-chart-frame'],
    });
  }, [onData, theme]);
  return (
    <>
      <ExampleSection
        title="스타일 적용 전"
        description="두 영역을 가로로 배치한 비교 예제입니다. 프레임 높이도 지정하지 않았습니다."
      >
        <PageLayout applied={false} />
      </ExampleSection>
      <ExampleSection
        title="패널과 차트 프레임에 적용"
        description="전체를 세로로 배치하고 owp-chart-frame 클래스에 반응형 높이를 적용합니다."
      >
        <PageLayout applied />
      </ExampleSection>
      <ExampleSection
        title="대상 클래스가 없는 자식"
        description="전체 세로 배치는 유지됩니다. owp-chart-frame 클래스가 없으면 프레임 높이를 지정하지 않습니다."
      >
        <PageLayout applied classes={false} />
      </ExampleSection>
    </>
  );
}
