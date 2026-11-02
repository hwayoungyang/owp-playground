import { useEffect } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { OwpPageContent, OwpSection } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { responsiveLayoutStyles } from '@owp/components/utils';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  useEffect(() => {
    onData(responsiveLayoutStyles);
  }, [onData]);
  const actions = (
    <>
      {['검색', '초기화', '선택 항목 내보내기'].map((label) => (
        <Button variant="outlined" key={label} sx={{ whiteSpace: 'nowrap' }}>
          {t(label)}
        </Button>
      ))}
    </>
  );
  return (
    <>
      <ExampleSection
        title="헤더를 가로에서 세로로"
        description="기본 가로 헤더와 responsiveHeaderLayoutStyle을 적용한 헤더를 비교합니다."
      >
        <div className="components-example-grid">
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2, bgcolor: 'action.hover' }}>
            <Typography>{t('샘플 헤더')}</Typography>
            <Button>{t('검색 조건')}</Button>
          </Box>
          <Box
            sx={{
              ...responsiveLayoutStyles.responsiveHeaderLayoutStyle,
              p: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Typography sx={responsiveLayoutStyles.responsiveHeaderTitleStyle}>
              {t('샘플 헤더')}
            </Typography>
            <Box sx={responsiveLayoutStyles.responsiveHeaderSlotsStyle}>
              <Button>{t('검색 조건')}</Button>
            </Box>
          </Box>
        </div>
      </ExampleSection>
      <ExampleSection
        title="작업 버튼 가로 스크롤"
        description="기본 줄바꿈 영역과 가로 스크롤 영역을 비교합니다. 버튼은 스크롤 영역에서 한 줄을 유지합니다."
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, maxWidth: 320 }}>{actions}</Box>
          <Box
            sx={{
              ...responsiveLayoutStyles.responsiveActionScrollContainerStyle,
              maxWidth: '320px !important',
            }}
          >
            <Box sx={{ ...responsiveLayoutStyles.responsiveActionRowStyle, gap: 2 }}>{actions}</Box>
          </Box>
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="본문과 항목 크기"
        description="responsiveBodyStyle과 item·stackItem 스타일로 본문을 콘텐츠 높이에 맞춥니다."
      >
        <Box sx={responsiveLayoutStyles.responsivePageContentStyle}>
          <OwpPageContent title={t('페이지 본문')}>
            <OwpSection title={t('샘플 헤더')}>
              <Box
                sx={{
                  ...responsiveLayoutStyles.responsiveBodyStyle,
                  p: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Box sx={responsiveLayoutStyles.responsiveItemStyle}>
                  <Typography>{t('첫 번째 항목')}</Typography>
                </Box>
                <Box sx={responsiveLayoutStyles.responsiveStackItemStyle}>
                  <Typography>{t('두 번째 항목')}</Typography>
                </Box>
              </Box>
            </OwpSection>
          </OwpPageContent>
        </Box>
      </ExampleSection>
    </>
  );
}
